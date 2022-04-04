require("@nomiclabs/hardhat-waffle");
require('solidity-coverage');

const dotenv = require('dotenv');
dotenv.config();

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

task("addVoting", "Create a voting")
  .addParam("candidates", "Enter an array of candidates")
  .setAction(async function ({ candidates }) {
    const Election = await ethers.getContractFactory("Election");
    const election = Election.attach(CONTRACT_ADDRESS);

    await election.addVoting([candidates]);

    console.log(`You have created a voting with ${candidates} candidates`);
  });

task("vote", "Vote")
  .addParam("votingnumber", "Enter voting number")
  .addParam("candidateid", "Enter candidate id")
  .setAction(async function ({ votingnumber, candidateid }) {
    const Election = await ethers.getContractFactory("Election");
    const election = Election.attach(CONTRACT_ADDRESS);
    const [addr] = await ethers.getSigners();

    await (await election.connect(addr).vote(votingnumber, candidateid, { value: ethers.utils.parseEther("0.1") })).wait();

    console.log(`You have voted in ${votingnumber} voting to ${candidateid} candidate!`);
  });

task("withdrawcommissions", "Withdraw commissions")
  .addParam("account", "Enter address where withdraw")
  .setAction(async function ({ account }) {
    const Election = await ethers.getContractFactory("Election");
    const election = Election.attach(CONTRACT_ADDRESS);

    await election.withdrawCommissions(account);

    console.log(`You have withdrawn to ${account} successfully!`);
  });

task("finishvoting", "Finish voting")
  .addParam("votingnumber", "Enter voting number to finish")
  .setAction(async function ({ votingnumber }) {
    const Election = await ethers.getContractFactory("Election");
    const election = Election.attach(CONTRACT_ADDRESS);

    await election.finishVoting(votingnumber);

    console.log(`${votingnumber} number of voting is finished`);
  });

task("getcandidatevotes", "Get candidate votes")
  .addParam("votingnumber", "Enter voting number")
  .addParam("candidateid", "Enter candidate number")
  .setAction(async function ({ votingnumber, candidateid }) {
    const Election = await ethers.getContractFactory("Election");
    const election = Election.attach(CONTRACT_ADDRESS);

    const candidateVotes = await election.getCandidateVotes(votingnumber, candidateid);

    console.log(`Candidate address: ${candidateVotes[0]}, amount of votes: ${candidateVotes[1]}`);

  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.13",
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [`${RINKEBY_PRIVATE_KEY}`]
    }
  }
};
