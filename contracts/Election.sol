// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Election {
    struct Voting {
        address[] candidates;
        uint256[] candidatesToVotes;
        uint256 time;
        bool isFinished;
    }

    struct Winner {
        mapping(address => bool) candidateToWin;
    }

    struct Voter {
        mapping(uint256 => bool) votingToVote;
    }

    mapping(uint256 => Winner) private winners;
    mapping(address => Voter) private voters;
    Voting[] private votings;
    mapping(uint256 => address) private candidates;

    uint256 private candidatesCount;
    uint256 private totalVotings;

    uint256 private commissions;
    uint256 private balance;

    address private owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Can use only owner's address");

        _;
    }

    function addVoting(address[] memory _candidates) external onlyOwner {
        totalVotings++;

        uint256[] memory _candidatesToVotes = new uint256[](_candidates.length);

        votings.push(
            Voting(_candidates, _candidatesToVotes, block.timestamp, false)
        );

        addCandidates(_candidates);
    }

    function addCandidates(address[] memory _candidates) internal {
        for (uint256 i = 0; i < _candidates.length; i++) {
            uint256 x;
            for (uint256 j = 1; j < candidatesCount + 1; j++) {
                if (candidates[j] == _candidates[i]) {
                    x = 0;
                    x++;
                }
            }
            if (x == 0) {
                candidatesCount++;
                candidates[candidatesCount] = _candidates[i];
            }
        }
    }

    function vote(uint256 _voting_number, uint256 candidateId)
        external
        payable
    {
        require(
            votings[_voting_number - 1].isFinished == false,
            "Voting has aleready finished"
        );
        require(
            10000000000000000 < msg.value,
            "You need spend more than '0,01' ETH!"
        );
        require(
            voters[msg.sender].votingToVote[_voting_number] == false,
            "You voted in this voting"
        );
        require(
            0 < _voting_number && _voting_number <= totalVotings,
            "That voting does not exist"
        );
        require(
            0 < candidateId &&
                candidateId <= votings[_voting_number - 1].candidates.length,
            "That candidate does not exist"
        );

        voters[msg.sender].votingToVote[_voting_number] = true;
        votings[_voting_number - 1].candidatesToVotes[candidateId - 1]++;

        commissions = msg.value / 10;
        balance = msg.value - commissions;
    }

    function withdrawCommissions(address account) external onlyOwner {
        require(commissions > 0, "No money!");

        payable(account).transfer(commissions);

        commissions = 0;
    }

    function finishVoting(uint256 _voting_number) external {
        require(
            votings[_voting_number - 1].time + 259200 >= block.timestamp,
            "You need wait more!"
        );

        uint256 highest;
        address candidate;

        for (
            uint256 i = 0;
            i < votings[_voting_number - 1].candidates.length;
            i++
        ) {
            if (votings[_voting_number - 1].candidatesToVotes[i] > highest) {
                highest = votings[_voting_number - 1].candidatesToVotes[i];
                candidate = votings[_voting_number - 1].candidates[i];
            }
        }

        winners[_voting_number].candidateToWin[candidate] = true;
        votings[_voting_number - 1].isFinished = true;

        payable(candidate).transfer(balance);

        balance = 0;
    }

    function getVoting(uint256 _voting_number)
        external
        view
        returns (address[] memory)
    {
        return votings[_voting_number - 1].candidates;
    }

    function getCandidate(uint256 candidate_number)
        external
        view
        returns (address)
    {
        return candidates[candidate_number];
    }

    function getBalance() external view returns (uint256) {
        return balance;
    }

    function getCommissions() external view onlyOwner returns (uint256) {
        return commissions;
    }

    function getCandidateVotes(uint256 _voting_number, uint256 candidateId)
        external
        view
        returns (address, uint256)
    {
        return (
            votings[_voting_number - 1].candidates[candidateId - 1],
            votings[_voting_number - 1].candidatesToVotes[candidateId - 1]
        );
    }

    function getVotes(uint256 _voting_number, uint256 candidateId)
        external
        view
        returns (uint256)
    {
        return votings[_voting_number - 1].candidatesToVotes[candidateId - 1];
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function isVotingFinished(uint256 _voting_number)
        external
        view
        returns (bool)
    {
        return votings[_voting_number - 1].isFinished;
    }

    function isVoted(uint256 _voting_number) external view returns (bool) {
        return voters[msg.sender].votingToVote[_voting_number];
    }

    function winner(uint256 _voting_number, address candidate_address)
        external
        view
        returns (bool)
    {
        return winners[_voting_number].candidateToWin[candidate_address];
    }
}
