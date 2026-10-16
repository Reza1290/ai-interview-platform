# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FitGap::Engine do
  let(:organization) { Organization.create!(name: 'FitGap Org', scheme: 'fitgap', identifier: 'fitgap', host: 'fitgap.test') }
  let(:assessment) do
    Assessment.create!(
      tenant_id: organization.id,
      created_by: 1,
      name: 'Senior Backend Engineer',
      time_limit_min: 30
    )
  end
  let(:session) do
    Session.create!(
      tenant_id: organization.id,
      assessment: assessment,
      invite_token: SecureRandom.hex(16),
      status: :ended
    )
  end
  let(:portfolio) { Portfolio.create!(session: session, generation_status: 'complete') }
  let(:vacancy) do
    Vacancy.create!(
      tenant_id: organization.id,
      created_by: 1,
      role_title: 'Senior Backend Engineer'
    )
  end
  let(:mock_gemini_client) { instance_double(Gemini::HttpClient) }

  before do
    allow(mock_gemini_client).to receive(:generate_content).and_return({
      'culture_narrative' => 'Strong team fit.',
      'overall_narrative' => 'Recommended candidate.'
    }.to_json)
  end

  describe '#call' do
    it 'handles skills with nil ai_level without raising NoMethodError on nil arithmetic' do
      # Vacancy expects Ruby L3 and Docker L3
      vacancy.vacancy_skills.create!(skill_label: 'Ruby', expected_level: 3)
      vacancy.vacancy_skills.create!(skill_label: 'Docker', expected_level: 3)

      # Candidate has Ruby L4 (assessed) and Docker with nil ai_level (unassessed)
      portfolio.portfolio_skills.create!(
        skill_label: 'Ruby',
        ai_level: 4,
        ai_confidence: 'high',
        competency_summary: 'Expert in Ruby'
      )
      portfolio.portfolio_skills.create!(
        skill_label: 'Docker',
        ai_level: nil,
        ai_confidence: nil,
        competency_summary: 'Unassessed'
      )

      engine = described_class.new(portfolio: portfolio, vacancy: vacancy, gemini_client: mock_gemini_client)
      
      expect { engine.call }.not_to raise_error

      report = FitGapReport.find_by(portfolio_id: portfolio.id, vacancy_id: vacancy.id)
      comparisons = report.skill_comparisons

      ruby_comparison = comparisons.find { |c| c['skill_label'] == 'Ruby' }
      expect(ruby_comparison['result']).to eq('exceed')
      expect(ruby_comparison['delta']).to eq(1)

      docker_comparison = comparisons.find { |c| c['skill_label'] == 'Docker' }
      expect(docker_comparison['result']).to eq('not_assessed')
      expect(docker_comparison['candidate_level']).to be_nil
      expect(docker_comparison['delta']).to be_nil
    end

    it 'handles completely missing portfolio skills as not_assessed' do
      vacancy.vacancy_skills.create!(skill_label: 'Kubernetes', expected_level: 4)

      engine = described_class.new(portfolio: portfolio, vacancy: vacancy, gemini_client: mock_gemini_client)
      report = engine.call
      k8s = report.skill_comparisons.find { |c| c['skill_label'] == 'Kubernetes' }

      expect(k8s['result']).to eq('not_assessed')
      expect(k8s['candidate_level']).to be_nil
      expect(k8s['delta']).to be_nil
    end
  end
end
