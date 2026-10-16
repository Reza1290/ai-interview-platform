# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Authentication', type: :request do
  let!(:admin_user) do
    User.create!(
      email: 'admin@rakamin.com',
      password: 'password123',
      role: 'admin'
    )
  end

  let!(:assessor_user) do
    User.create!(
      email: 'assessor@rakamin.com',
      password: 'password123',
      role: 'assessor'
    )
  end

  let!(:regular_user) do
    User.create!(
      email: 'candidate@example.com',
      password: 'password123',
      role: 'user'
    )
  end

  describe 'POST /api/v1/auth/login' do
    it 'allows admin users to authenticate and receive JWT' do
      post '/api/v1/auth/login',
           params: { email: 'admin@rakamin.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['user']['role']).to eq('admin')
    end

    it 'allows assessor users to authenticate and receive JWT' do
      post '/api/v1/auth/login',
           params: { email: 'assessor@rakamin.com', password: 'password123' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['token']).to be_present
      expect(json['user']['role']).to eq('assessor')
    end

    it 'rejects regular users with unauthorized status' do
      post '/api/v1/auth/login',
           params: { email: 'candidate@example.com', password: 'password123' }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects invalid credentials' do
      post '/api/v1/auth/login',
           params: { email: 'assessor@rakamin.com', password: 'wrongpassword' }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
