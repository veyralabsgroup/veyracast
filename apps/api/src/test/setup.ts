jest.mock('dotenv', () => ({
  __esModule: true,
  default: { config: jest.fn() },
  config: jest.fn(),
}));

// Give each worker its own IG risk-state file so parallel suites don't race.
const os = require('os');
const path = require('path');
process.env.IG_RISK_STATE_PATH = path.join(
  os.tmpdir(),
  `veyracast-igrisk-${process.env.JEST_WORKER_ID || '0'}.json`,
);
