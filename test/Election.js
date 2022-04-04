const { expect } = require("chai");

describe("Voting contract", function () {
    let Election;
    let election;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        Election = await ethers.getContractFactory("Election");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        election = await Election.deploy();
    });

    describe("Deployment", function () {
        it("Shoud set the right owner", async function () {
            expect(await election.getOwner()).to.equal(owner.address);
        });
    });

    describe("Creating a voting", function () {
        it("Can be created only by owner", async function () {
            try {
                await election.connect(addr1.address).addVoting([owner.address, addr2.address]);
                expect(false);
            } catch (err) {
                expect(err);
            }
        });

        it("Should add right candidates to voting", async function () {

            await election.addVoting([addr1.address, addr2.address]);
            const candidates = await election.getVoting(1);

            expect(candidates[0]).to.equals(addr1.address);
            expect(candidates[1]).to.equals(addr2.address);
        });

        it("Should add right candidates, without repeatitation", async function () {
            await election.addVoting([addr1.address, addr2.address]);
            await election.addVoting([addr1.address, addr2.address]);

            const candidate_1 = await election.getCandidate(1);
            const candidate_2 = await election.getCandidate(2);
            const candidate_3 = await election.getCandidate(3);

            expect(candidate_1).to.equals(addr1.address);
            expect(candidate_2).to.equals(addr2.address);
            expect(candidate_3).to.equals('0x0000000000000000000000000000000000000000');
        });
    });

    describe("Vote function", function () {
        it("Can be voted if this voting is not finished", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            const isVotingFinished = await election.isVotingFinished(1);

            expect(isVotingFinished).to.equals(false);
        });

        it("Can vote if only you send '0,01' ETH", async function () {
            await election.addVoting([addr1.address, addr2.address]);
            try {
                await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("0,001") });

                expect(false);
            } catch (err) {
                expect(err);
            }

        });

        it("Can vote only one time in one voting", async function () {
            await election.addVoting([addr1.address, addr2.address]);
            try {
                await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });
                await election.connect(addr1).vote(1, 2, { from: addr1.address, value: ethers.utils.parseEther("1") });

                expect(false);
            } catch (err) {
                expect(err);
            }
        });

        it("Can vote only in existing votings", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            try {
                await election.connect(addr1).vote(12, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });

                expect(false);
            } catch (err) {
                expect(err);
            }

        });

        it("Can vote only to existing candidate", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            try {
                await election.connect(addr1).vote(1, 12, { from: addr1.address, value: ethers.utils.parseEther("1") });

                expect(false);
            } catch (err) {
                expect(err);
            }
        })

        it("Whether voter voted before", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            const is_voted = await election.connect(addr1).isVoted(1);
            expect(is_voted).to.equal(false);

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });

            const isVoted = await election.connect(addr1).isVoted(1);
            expect(isVoted).to.equal(true);
        });

        it("Should increase the count of votes correctly", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });

            const candidateVotes = await election.getVotes(1, 1);

            expect(candidateVotes).to.equal(1);
        });

        it("Should divide '0,01'ETH correctly to commission 10% from total balance", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            const value = await ethers.utils.parseEther("1");

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: value });

            const commissions = await election.getCommissions();
            const balance = await election.getBalance();

            expect(commissions > value / 10);
            expect(balance > value - commissions);
        })
    });

    describe("Withdraw all commssions", function () {
        it("Can only owner withdraw commissions", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });
            try {
                await election.connect(addr1).withdrawCommissions(addr1.address);

                expect(false);
            } catch (err) {
                expect(err);
            }
        })

        it("Should correctly transfer all commssions", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });

            await election.withdrawCommissions(owner.address);

            const commissions = await election.getCommissions();
            expect(commissions).to.equal(0);
        });
    });

    describe("Finish voting", async function () {
        it("Should transfer who won", async function () {
            await election.addVoting([addr1.address, addr2.address]);

            await election.connect(addr1).vote(1, 1, { from: addr1.address, value: ethers.utils.parseEther("1") });
            await election.connect(addr2).vote(1, 1, { from: addr2.address, value: ethers.utils.parseEther("1") });
            await election.connect(owner).vote(1, 1, { from: owner.address, value: ethers.utils.parseEther("1") });

            await election.finishVoting(1);

            const balance = await election.getBalance();
            const isVotingFinished = await election.isVotingFinished(1);
            const winner = await election.winner(1, addr1.address);

            expect(isVotingFinished).to.equal(true);
            expect(winner).to.equal(true);
            expect(balance).to.equal(0);
        });
    })
})