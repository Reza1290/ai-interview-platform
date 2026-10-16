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
end
