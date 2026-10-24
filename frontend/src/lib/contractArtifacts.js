// Contract ABIs and deployment bytecode for in-browser deployment
import examVaultArtifact from "../../../artifacts/contracts/ExamVault.sol/ExamVault.json";
import collegeTokenArtifact from "../../../artifacts/contracts/CollegeAccessToken.sol/CollegeAccessToken.json";

export const EXAM_VAULT_ABI = examVaultArtifact.abi;
export const EXAM_VAULT_BYTECODE = examVaultArtifact.bytecode;
export const COLLEGE_TOKEN_ABI = collegeTokenArtifact.abi;
export const COLLEGE_TOKEN_BYTECODE = collegeTokenArtifact.bytecode;
