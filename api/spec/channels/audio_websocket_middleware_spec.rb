# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AudioWebSocketMiddleware do
  let(:app) { ->(env) { [200, { 'Content-Type' => 'text/plain' }, ['OK']] } }
  let(:middleware) { described_class.new(app) }
  let(:organization) { Organization.create!(name: 'Audio Org', scheme: 'audio01', identifier: 'audio01', host: 'audio01.test') }
  let(:assessment) do
    Assessment.create!(
      tenant_id: organization.id,
      created_by: 1,
      name: 'Audio Test',
      time_limit_min: 30,
      system_prompt: 'System prompt'
    )
  end
  let(:session) do
    Session.create!(
      tenant_id: organization.id,
      assessment: assessment,
      invite_token: SecureRandom.hex(16),
      status: :active
    )
  end
  let(:mock_ws) { double('Faye::WebSocket', send: true) }
  let(:state) { AudioWebSocketMiddleware::ConnectionState.new }

  after(:each) do
    AudioWebSocketMiddleware.active_states.clear
    AudioWebSocketMiddleware.active_connections.clear
  end

  describe '#build_on_ready' do
    it 'emits speaker_changed: candidate when resuming an already active session' do
      messages = []
      allow(mock_ws).to receive(:send) do |payload|
        messages << JSON.parse(payload)
      end

      # Session is active and model is not speaking (e.g. candidate refreshed)
      expect(session.active?).to be true
      state.model_speaking = false

      allow(middleware).to receive(:schedule_proactive_reconnect)

      on_ready_cb = middleware.send(:build_on_ready, mock_ws, state, session)
      on_ready_cb.call

      speaker_msg = messages.find { |m| m['type'] == 'speaker_changed' }
      expect(speaker_msg).to be_present
      expect(speaker_msg['speaker']).to eq('candidate')

      session_started_msg = messages.find { |m| m['type'] == 'session_started' }
      expect(session_started_msg).to be_present
      expect(session_started_msg['session_id']).to eq(session.id)
    end
  end

  describe '#handle_browser_open ghost timer cancellation' do
    it 'cancels existing graceful_end_timer on previous state when reconnecting' do
      old_state = AudioWebSocketMiddleware::ConnectionState.new
      old_state.session = session
      mock_timer = double('EM::Timer', cancel: true)
      old_state.graceful_end_timer = mock_timer

      AudioWebSocketMiddleware.active_states[session.id.to_s] = old_state

      expect(mock_timer).to receive(:cancel).once

      new_state = AudioWebSocketMiddleware::ConnectionState.new
      mock_browser_ws = double('Faye::WebSocket', send: true, close: true)

      env = {
        'PATH_INFO' => "/ws/sessions/#{session.id}/audio",
        'rack.input' => StringIO.new,
        'QUERY_STRING' => "token=#{session.invite_token}"
      }

      allow(middleware).to receive(:connect_to_gemini)

      middleware.send(:handle_browser_open, env, session.id.to_s, mock_browser_ws, new_state)

      expect(old_state.graceful_end_timer).to be_nil
      expect(AudioWebSocketMiddleware.active_states[session.id.to_s]).to eq(new_state)
    end
  end

  describe '#ai_closing_detected?' do
    let(:polite_text) { "Thank you for your time explaining your architecture, now let's discuss PostgreSQL." }
    let(:closing_text) { "Thank you for your time today. That concludes our interview, good luck!" }

    it 'does NOT trigger closing on polite phrases during early interview turns' do
      session.update!(started_at: 2.minutes.ago)
      state.coverage_pending = false

      detected = middleware.send(:ai_closing_detected?, polite_text, state, session)
      expect(detected).to be false
    end

    it 'triggers closing when coverage_pending is true' do
      session.update!(started_at: 2.minutes.ago)
      state.coverage_pending = true

      detected = middleware.send(:ai_closing_detected?, closing_text, state, session)
      expect(detected).to be true
    end

    it 'triggers closing when >= 90% of time limit has elapsed' do
      # 30 minute limit: 90% is 27 minutes. Started 28 minutes ago:
      session.update!(started_at: 28.minutes.ago)
      state.coverage_pending = false

      detected = middleware.send(:ai_closing_detected?, closing_text, state, session)
      expect(detected).to be true
    end
  end

  describe '.terminate_session_connections' do
    it 'closes browser websockets and gemini clients on session termination' do
      mock_gemini = double('Gemini::LiveClient', close: true)
      state.gemini_client = mock_gemini
      mock_browser_ws = double('Faye::WebSocket', send: true, close: true)

      AudioWebSocketMiddleware.active_states[session.id.to_s] = state
      AudioWebSocketMiddleware.active_connections[session.id.to_s] = [{ ws: mock_browser_ws, state: state }]

      expect(mock_gemini).to receive(:close).once
      expect(mock_browser_ws).to receive(:send).with(include('session_ended'))

      AudioWebSocketMiddleware.terminate_session_connections(session.id, reason: 'manual_assessor')

      expect(AudioWebSocketMiddleware.active_states[session.id.to_s]).to be_nil
      expect(AudioWebSocketMiddleware.active_connections[session.id.to_s]).to be_empty
    end
  end

  describe '#save_transcript_turn atomic concurrency' do
    it 'persists concurrent turns across multiple parallel threads without RecordNotUnique or drops' do
      threads = []
      turns_count = 10

      turns_count.times do |i|
        threads << Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            middleware.send(:save_transcript_turn, session, i + 1, 'candidate', "Turn content #{i}")
          end
        end
      end

      threads.each(&:join)

      saved_turns = session.transcript_turns.order(:turn_number)
      expect(saved_turns.count).to eq(turns_count)
      expect(saved_turns.pluck(:turn_number)).to eq((1..turns_count).to_a)
    end
  end
end
