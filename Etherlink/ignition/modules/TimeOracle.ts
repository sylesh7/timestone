import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TimeOracleModule = buildModule("TimeOracleModule", (m) => {
  const TimeOracleContract = m.contract("TimeOracleFileLocker", []);

  return { TimeOracleContract };
});

export default TimeOracleModule;