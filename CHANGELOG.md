# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]

### Added

- Pluggable content-generation provider layer (`AI_PROVIDER`), defaulting to Claude via structured outputs
- `NOTICE` documenting the derivative work and original MIT project

### Changed

- Instagram browser automation demoted to an off-by-default opt-in; default path targets the official Instagram Graph API
- Content engine no longer hardcodes a single model/provider

### Removed

- reCAPTCHA ML subproject
- Hardcoded personal persona profile
