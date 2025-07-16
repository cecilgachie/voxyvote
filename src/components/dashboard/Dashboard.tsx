import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Poll, VoteStats, Activity } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { VotingInterface } from '../voting/VotingInterface';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { Vote, BarChart3, Users, Clock, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Listen for real-time updates
    socketService.onPollUpdate((data) => {
      setPolls(prev => prev.map(poll => 
        poll.id === data.pollId ? { ...poll, ...data } : poll
      ));
    });

    socketService.onNewActivity((activity) => {
      setRecentActivity(prev => [activity, ...prev.slice(0, 9)]);
    });

    return () => {
      socketService.off('poll_update');
      socketService.off('new_activity');
    };
  }, []);

  const fetchData = async () => {
    try {
      const [pollsResponse, statsResponse, activityResponse] = await Promise.all([
        api.get('/polls'),
        api.get('/stats'),
        api.get('/activity')
      ]);

      setPolls(pollsResponse.data);
      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmitted = () => {
    setSelectedPoll(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedPoll) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedPoll(null)}
          >
            ← Back to Dashboard
          </Button>
        </div>
        <VotingInterface
          poll={selectedPoll}
          onVoteSubmitted={handleVoteSubmitted}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.email}
          </h1>
          <p className="text-gray-600 mt-1">
            Participate in secure, blockchain-verified voting
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Vote className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActivePolls}</p>
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Polls */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Polls</h2>
            <div className="space-y-4">
              {polls.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No polls available</p>
              ) : (
                polls.map((poll) => {
                  const isActive = new Date() >= new Date(poll.startTime) && new Date() <= new Date(poll.endTime);
                  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
                  
                  return (
                    <div
                      key={poll.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{poll.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{poll.description}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Ends {format(new Date(poll.endTime), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              <span>{totalVotes} votes</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {isActive ? (
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
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="p-1 bg-blue-100 rounded-full">
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};