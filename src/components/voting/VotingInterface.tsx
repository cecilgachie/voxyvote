import React, { useState, useEffect } from 'react';
import { Poll, PollOption } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { Vote, Clock, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface VotingInterfaceProps {
  poll: Poll;
  onVoteSubmitted: () => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({ poll, onVoteSubmitted }) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteResults, setVoteResults] = useState<PollOption[]>(poll.options);

  useEffect(() => {
    // Check if user has already voted
    const checkVoteStatus = async () => {
      try {
        const response = await api.get(`/votes/status/${poll.id}`);
        setHasVoted(response.data.hasVoted);
      } catch (error) {
        console.error('Error checking vote status:', error);
      }
    };

    checkVoteStatus();

    // Join poll room for real-time updates
    socketService.joinPoll(poll.id);

    // Listen for real-time vote updates
    socketService.onVoteUpdate((data) => {
      if (data.pollId === poll.id) {
        setVoteResults(data.options);
      }
    });

    return () => {
      socketService.leavePoll(poll.id);
      socketService.off('vote_update');
    };
  }, [poll.id]);

  const handleVote = async () => {
    if (!selectedOption || hasVoted) return;

    setIsVoting(true);
    try {
      await api.post('/votes', {
        pollId: poll.id,
        optionId: selectedOption
      });
      
      setHasVoted(true);
      onVoteSubmitted();
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const isPollActive = new Date() >= new Date(poll.startTime) && new Date() <= new Date(poll.endTime);
  const totalVotes = voteResults.reduce((sum, option) => sum + option.votes, 0);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{poll.title}</h2>
          <div className="flex items-center space-x-2">
            {hasVoted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                Voted
              </span>
            )}
            {isPollActive ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Closed
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{poll.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 space-x-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Ends {format(new Date(poll.endTime), 'PPP')}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalVotes} votes</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {voteResults.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === option.id;
          
          return (
            <div
              key={option.id}
              className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${!isPollActive || hasVoted ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={() => {
                if (isPollActive && !hasVoted) {
                  setSelectedOption(option.id);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedOption(option.id)}
                    className="mr-3"
                    disabled={!isPollActive || hasVoted}
                  />
                  <span className="font-medium text-gray-900">{option.text}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{option.votes}</div>
                  <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              {hasVoted && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!hasVoted && isPollActive && (
        <div className="mt-6 pt-6 border-t">
          <Button
            onClick={handleVote}
            loading={isVoting}
            disabled={!selectedOption || isVoting}
            className="w-full"
          >
            <Vote className="w-4 h-4 mr-2" />
            Submit Vote
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Your vote will be encrypted and added to the blockchain for security
          </p>
        </div>
      )}

      {hasVoted && (
        <div className="mt-6 pt-6 border-t">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Vote Recorded</p>
                <p className="text-sm text-green-600">Your vote has been securely recorded on the blockchain</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};