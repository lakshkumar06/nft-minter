const { compile } = require('@parity/revive');
const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { basename, join } = require('path');

const compileContract = async (solidityFilePath, outputDir) => {
  try {
    // Read the Solidity file
    const source = readFileSync(solidityFilePath, 'utf8');

    // Construct the input object for the compiler
    const input = {
      [basename(solidityFilePath)]: { content: source },
    };

    console.log(`Compiling contract: ${basename(solidityFilePath)}...`);

    // Compile the contract
    const out = await compile(input);

    for (const contracts of Object.values(out.contracts)) {
      for (const [name, contract] of Object.entries(contracts)) {
        console.log(`Compiled contract: ${name}`);

        // Create directories if they don't exist
        const abiDir = join(outputDir, 'abis');
        const artifactsDir = join(outputDir, 'artifacts');
        
        if (!existsSync(abiDir)) {
          mkdirSync(abiDir, { recursive: true });
        }
        
        if (!existsSync(artifactsDir)) {
          mkdirSync(artifactsDir, { recursive: true });
        }

        // Write the ABI
        const abiPath = join(abiDir, `${name}.json`);
        writeFileSync(abiPath, JSON.stringify(contract.abi, null, 2));
        console.log(`ABI saved to ${abiPath}`);

        // Write the bytecode
        const bytecodePath = join(artifactsDir, `${name}.polkavm`);
        writeFileSync(
          bytecodePath,
          Buffer.from(contract.evm.bytecode.object, 'hex')
        );
        console.log(`Bytecode saved to ${bytecodePath}`);
      }
    }
  } catch (error) {
    console.error('Error compiling contracts:', error);
  }
};

// Compile both contracts
const contracts = ['Storage.sol', 'NFTMinter.sol'];
const outputDir = join(__dirname, '..');

for (const contract of contracts) {
  const solidityFilePath = join(__dirname, '..', 'contracts', contract);
  compileContract(solidityFilePath, outputDir);
} 