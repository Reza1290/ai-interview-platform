# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Portfolios', type: :request do
  let!(:org_a) do
    Organization.create!(
      name: 'Tenant Alpha',
      scheme: 'tenant-alpha',
      identifier: 'tenant-alpha',
      host: 'tenant-alpha.test',
      config: {}
    )
  end

  let!(:org_b) do
    Organization.create!(
      name: 'Tenant Beta',
      scheme: 'tenant-beta',
      identifier: 'tenant-beta',
      host: 'tenant-beta.test',
      config: {}
    )
  end

  let!(:assessment_a) do
    Assessment.create!(
      tenant_id: org_a.id,
      created_by: 1,
      name: 'Alpha Software Engineer Assessment',
      time_limit_min: 30
    )
  end

  let!(:session_a) do
    Session.create!(
      tenant_id: org_a.id,
      assessment: assessment_a,
      status: 'ended',
      candidate_name: 'Jane Doe'
    )
  end

  let!(:portfolio_a) do
    Portfolio.create!(
      session: session_a,
      generation_status: 'complete',
      generated_at: Time.current
    )
  end

  let(:token_a) do
    JsonWebToken.encode({ user_id: 1, role: 'assessor', scheme: org_a.scheme })
  end

  let(:token_b) do
    JsonWebToken.encode({ user_id: 2, role: 'assessor', scheme: org_b.scheme })
  end

  describe 'GET /api/v1/portfolios/:id/export' do
    it 'returns 404 when an assessor from Tenant B attempts to access a portfolio belonging to Tenant A' do
      get "/api/v1/portfolios/#{portfolio_a.id}/export",
          headers: { 'Authorization' => "Bearer #{token_b}" }

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['errors'].first['message']).to match(/Portfolio not found/i)
    end

    it 'returns 200 when an assessor from Tenant A accesses their own portfolio' do
      get "/api/v1/portfolios/#{portfolio_a.id}/export",
          headers: { 'Authorization' => "Bearer #{token_a}" }

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /api/v1/portfolios/:id/fitgap' do
    it 'returns 404 when an assessor from Tenant B attempts to calculate fitgap on Tenant A portfolio' do
      post "/api/v1/portfolios/#{portfolio_a.id}/fitgap",
           params: { vacancy_id: 123 },
           headers: { 'Authorization' => "Bearer #{token_b}" }

      expect(response).to have_http_status(:not_found)
    end
  end
end
