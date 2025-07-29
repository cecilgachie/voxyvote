import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Poll, VoteStats, Activity } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { VotingInterface } from '../voting/VotingInterface';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { Vote, BarChart3, Users, Clock, Plus, TrendingUp, ArrowRight, Calendar, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 bg-gray-200 rounded-2xl"></div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
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
            icon={<ArrowRight className="w-4 h-4 rotate-180" />}
          >
            Back to Dashboard
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-blue-100 text-lg">
              Participate in secure, blockchain-verified voting
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button variant="gradient" size="lg" icon={<Plus className="w-5 h-5" />}>
              Create Poll
            </Button>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
                <Vote className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalVotes.toLocaleString()}</p>
                <p className="text-xs text-green-600 font-medium">+12% from last week</p>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalActivePolls}</p>
                <p className="text-xs text-blue-600 font-medium">Currently running</p>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white">
                <Users className="h-8 w-8" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-purple-600 font-medium">Registered voters</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Active Polls */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Polls</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live voting</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {polls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Vote className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No polls available</p>
                  <p className="text-gray-400 text-sm">Check back later for new voting opportunities</p>
                </div>
              ) : (
                polls.map((poll) => {
                  const isActive = new Date() >= new Date(poll.startTime) && new Date() <= new Date(poll.endTime);
                  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
                  const timeLeft = new Date(poll.endTime).getTime() - new Date().getTime();
                  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={poll.id}
                      className="group border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-white to-gray-50"
                      onClick={() => setSelectedPoll(poll)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {poll.title}
                            </h3>
                            {isActive ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Closed
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-4 leading-relaxed">{poll.description}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>Ends {format(new Date(poll.endTime), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              <span>{totalVotes} votes</span>
                            </div>
                            {isActive && (
                              <div className="flex items-center text-orange-600 font-medium">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>{daysLeft} days left</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center">
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Enhanced Recent Activity */}
        <div>
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
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