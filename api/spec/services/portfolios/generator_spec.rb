# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Portfolios::Generator do
  let(:organization) { Organization.create!(name: 'Generator Org', scheme: 'genorg', identifier: 'genorg', host: 'genorg.test') }
  let(:assessment) do
    Assessment.create!(
      tenant_id: organization.id,
      created_by: 1,
      name: 'Fullstack Dev',
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
  let(:mock_gemini_client) { instance_double(Gemini::HttpClient) }

  subject(:generator) { described_class.new(session: session, gemini_client: mock_gemini_client) }

  describe '#call' do
    it 'preserves nil level for unassessed skills without forcing level 1' do
      mock_response = {
        'configured_skills' => [
          {
            'skill_id' => 'sk-01',
            'skill_label' => 'Ruby on Rails',
            'level' => 3,
            'confidence' => 'high',
            'evidence' => ['writes clean services'],
            'competency_summary' => 'Solid Rails expertise'
          },
          {
            'skill_id' => 'sk-02',
            'skill_label' => 'GraphQL API',
            'level' => nil,
            'confidence' => nil,
            'evidence' => [],
            'competency_summary' => nil
          }
        ],
        'discovered_skills' => []
      }.to_json

      allow(mock_gemini_client).to receive(:generate_content).and_return(mock_response)

      portfolio = generator.call
      skills = portfolio.portfolio_skills.order(:skill_label)

      assessed = skills.find_by(skill_label: 'Ruby on Rails')
      expect(assessed.ai_level).to eq(3)
      expect(assessed.unassessed?).to be false

      unassessed = skills.find_by(skill_label: 'GraphQL API')
      expect(unassessed.ai_level).to be_nil
      expect(unassessed.unassessed?).to be true
      expect(unassessed.competency_summary).to eq('Skill not assessed during interview.')
    end
  end
end
