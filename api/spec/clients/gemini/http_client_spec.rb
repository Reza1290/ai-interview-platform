# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gemini::HttpClient do
  let(:custom_org) do
    Organization.create!(
      name: 'Custom HTTP Org',
      scheme: 'custom-http-org',
      identifier: 'custom-http-org',
      host: 'custom-http.test',
      config: {
        'ai' => {
          'gemini_api_key' => 'AIzaSyHttpTenantCustomKey',
          'models' => {
            'pro' => 'gemini-tenant-pro-custom'
          }
        }
      }
    )
  end

  let(:default_org) do
    Organization.create!(
      name: 'Default HTTP Org',
      scheme: 'default-http-org',
      identifier: 'default-http-org',
      host: 'default-http.test'
    )
  end

  describe '#initialize' do
    it 'injects tenant-specific credentials and pro model from organization' do
      client = described_class.new(organization: custom_org)

      expect(client.api_key).to eq('AIzaSyHttpTenantCustomKey')
      expect(client.model).to eq('gemini-tenant-pro-custom')
    end

    it 'falls back to ENV when organization has no custom config' do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('GEMINI_API_KEY').and_return('ENV_GLOBAL_KEY_HTTP')
      allow(ENV).to receive(:[]).with('GEMINI_PRO_MODEL').and_return('gemini-env-pro')

      client = described_class.new(organization: default_org)

      expect(client.api_key).to eq('ENV_GLOBAL_KEY_HTTP')
      expect(client.model).to eq('gemini-env-pro')
    end

    it 'allows explicit parameters to override organization config' do
      client = described_class.new(
        organization: custom_org,
        api_key: 'AIzaSyExplicitHttpKey',
        model: 'explicit-model-pro'
      )

      expect(client.api_key).to eq('AIzaSyExplicitHttpKey')
      expect(client.model).to eq('explicit-model-pro')
    end
  end
end
