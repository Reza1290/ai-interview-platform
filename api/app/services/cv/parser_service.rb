# frozen_string_literal: true

module Cv
  # Extracts and normalizes unstructured text from candidate CVs (text strings, files, or streams).
  class ParserService
    def self.call(input)
      new(input).call
    end

    def initialize(input)
      @input = input
    end

    def call
      raw_text = read_input
      normalize_text(raw_text)
    end

    private

    def read_input
      return '' if @input.nil?

      if @input.respond_to?(:read)
        @input.rewind if @input.respond_to?(:rewind)
        @input.read.to_s
      elsif @input.is_a?(String) && file_path?(@input)
        File.read(@input)
      else
        @input.to_s
      end
    end

    def file_path?(string)
      string.length < 1024 && !string.include?("\n") && File.exist?(string)
    rescue SystemCallError
      false
    end

    def normalize_text(text)
      return '' if text.blank?

      # Scrub invalid byte sequences and convert to UTF-8
      cleaned = text.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')

      # Normalize Windows/Unix line endings
      cleaned = cleaned.gsub(/\r\n?/, "\n")

      # Replace non-breaking spaces and tabs
      cleaned = cleaned.tr("\u00A0", ' ').tr("\t", ' ')

      # Collapse multiple horizontal spaces
      cleaned = cleaned.gsub(/[ ]{2,}/, ' ')

      # Collapse 3+ newlines to double newlines (paragraphs)
      cleaned = cleaned.gsub(/\n{3,}/, "\n\n")

      cleaned.strip
    end
  end
end
