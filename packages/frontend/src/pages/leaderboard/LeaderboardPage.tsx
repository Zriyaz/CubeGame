import { useState } from 'react';
import { YStack, XStack, Stack, Text, ScrollView, Avatar, Tabs, Spinner } from 'tamagui';
import { Trophy, TrendingUp, Users, Crown, Medal, Award, Percent } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useLeaderboard, useWeeklyLeaderboard, useMonthlyLeaderboard } from '@/hooks/useLeaderboard';
import type { LeaderboardEntry as APILeaderboardEntry } from '@/api/leaderboard.api';

interface LeaderboardEntry extends APILeaderboardEntry {
  rank: number;
  isCurrentUser?: boolean;
}

type LeaderboardType = 'wins' | 'winRate' | 'weekly' | 'monthly';
type SortBy = 'wins' | 'winRate';

export function LeaderboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('wins');
  const [limit] = useState(20);
  
  // Fetch leaderboard data based on active tab
  const { data: winsData, isLoading: winsLoading } = useLeaderboard('wins', limit);
  const { data: winRateData, isLoading: winRateLoading } = useLeaderboard('winRate', limit);
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyLeaderboard(limit);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyLeaderboard(limit);
  
  // Get the appropriate data based on active tab
  const getLeaderboardData = (): APILeaderboardEntry[] | undefined => {
    switch (activeTab) {
      case 'wins': return winsData;
      case 'winRate': return winRateData;
      case 'weekly': return weeklyData;
      case 'monthly': return monthlyData;
      default: return winsData;
    }
  };
  
  const isLoading = activeTab === 'wins' ? winsLoading : 
                    activeTab === 'winRate' ? winRateLoading :
                    activeTab === 'weekly' ? weeklyLoading : monthlyLoading;
  
  const leaderboardData = getLeaderboardData();
  
  // Add rank and check if current user
  const rankedLeaderboard: LeaderboardEntry[] = leaderboardData?.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isCurrentUser: entry.userId === user?.id
  })) || [];
  
  const currentUserEntry = rankedLeaderboard.find(e => e.isCurrentUser);
  
  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$neonBlue" />
        <Text marginTop="$4" color="$textMuted">Loading leaderboard...</Text>
      </Stack>
    );
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" space="$4" maxWidth={1000} margin="0 auto" width="100%">
        <YStack space="$2">
          <Text fontSize="$2xl" fontWeight="bold">Leaderboard</Text>
          <Text color="$textMuted">See how you rank against other players</Text>
        </YStack>

        {/* Your Position Card */}
        {currentUserEntry && (
          <Card
            variant="elevated"
            backgroundColor="$surfaceHover"
            borderWidth={2}
            borderColor="$neonBlue"
          >
            <XStack space="$3" alignItems="center">
              <Text fontSize={48} fontWeight="900" color="$neonBlue">
                #{currentUserEntry.rank}
              </Text>
              
              <YStack flex={1} space="$1">
                <Text fontSize="$lg" fontWeight="bold">Your Position</Text>
                <XStack space="$4">
                  <Text fontSize="$sm" color="$textMuted">
                    Wins: <Text color="$neonGreen" fontWeight="bold">{currentUserEntry.wins}</Text>
                  </Text>
                  <Text fontSize="$sm" color="$textMuted">
                    Games: <Text color="$neonPink" fontWeight="bold">{currentUserEntry.totalGames}</Text>
                  </Text>
                  <Text fontSize="$sm" color="$textMuted">
                    Win Rate: <Text color="$neonYellow" fontWeight="bold">{currentUserEntry.winRate.toFixed(1)}%</Text>
                  </Text>
                </XStack>
              </YStack>
              
              <Trophy size={40} color="$neonYellow" />
            </XStack>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          defaultValue="wins"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as LeaderboardType)}
          orientation="horizontal"
          flexDirection="column"
          flex={1}
        >
          <Tabs.List backgroundColor="$surface" borderRadius="$lg" padding="$1">
            <Tabs.Trigger value="wins" flex={1}>
              <XStack space="$2" alignItems="center">
                <Trophy size={16} />
                <Text>Most Wins</Text>
              </XStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="winRate" flex={1}>
              <XStack space="$2" alignItems="center">
                <Percent size={16} />
                <Text>Win Rate</Text>
              </XStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="weekly" flex={1}>
              <XStack space="$2" alignItems="center">
                <TrendingUp size={16} />
                <Text>This Week</Text>
              </XStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="monthly" flex={1}>
              <XStack space="$2" alignItems="center">
                <Award size={16} />
                <Text>This Month</Text>
              </XStack>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value={activeTab} paddingTop="$4">
            <YStack space="$4">
              {/* Top 3 Podium */}
              {rankedLeaderboard.length >= 3 && (
                <XStack justifyContent="center" alignItems="flex-end" space="$2" paddingVertical="$4">
                  {/* 2nd Place */}
                  <PodiumCard
                    entry={rankedLeaderboard[1]}
                    height={120}
                    color="$silver"
                  />
                  
                  {/* 1st Place */}
                  <PodiumCard
                    entry={rankedLeaderboard[0]}
                    height={150}
                    color="$neonYellow"
                  />
                  
                  {/* 3rd Place */}
                  <PodiumCard
                    entry={rankedLeaderboard[2]}
                    height={90}
                    color="$bronze"
                  />
                </XStack>
              )}

              {/* Full Leaderboard */}
              <YStack space="$2">
                {rankedLeaderboard.map((entry) => (
                  <LeaderboardCard
                    key={entry.userId}
                    entry={entry}
                    activeTab={activeTab}
                  />
                ))}
              </YStack>
            </YStack>
          </Tabs.Content>
        </Tabs>
      </YStack>
    </ScrollView>
  );
}

function PodiumCard({ entry, height, color }: { entry: LeaderboardEntry; height: number; color: string }) {
  const medal = entry.rank === 1 ? <Crown size={32} /> : entry.rank === 2 ? <Medal size={28} /> : <Award size={24} />;
  
  return (
    <YStack alignItems="center" space="$2">
      <Avatar size="$6" circular borderWidth={3} borderColor={color}>
        <Avatar.Image src={entry.avatar} />
        <Avatar.Fallback backgroundColor={color}>
          <Text color="$white" fontWeight="bold">
            {entry.username[0].toUpperCase()}
          </Text>
        </Avatar.Fallback>
      </Avatar>
      
      <YStack alignItems="center">
        <Text fontWeight="bold" fontSize="$sm">{entry.username}</Text>
        <Text fontSize="$xs" color="$textMuted">{entry.wins} wins</Text>
      </YStack>
      
      <Stack
        height={height}
        width={100}
        backgroundColor={color}
        borderTopLeftRadius="$lg"
        borderTopRightRadius="$lg"
        alignItems="center"
        justifyContent="center"
      >
        <Stack color="$white">{medal}</Stack>
        <Text fontSize="$2xl" fontWeight="900" color="$white">
          {entry.rank}
        </Text>
      </Stack>
    </YStack>
  );
}

function LeaderboardCard({ entry, activeTab }: { entry: LeaderboardEntry; activeTab: LeaderboardType }) {
  const rankColor = entry.rank === 1 ? '$neonYellow' : entry.rank === 2 ? '$silver' : entry.rank === 3 ? '$bronze' : '$textMuted';
  
  return (
    <Card
      variant={entry.isCurrentUser ? 'elevated' : 'outlined'}
      backgroundColor={entry.isCurrentUser ? '$surfaceHover' : '$surface'}
      borderWidth={entry.isCurrentUser ? 2 : 0}
      borderColor={entry.isCurrentUser ? '$neonBlue' : undefined}
    >
      <XStack space="$3" alignItems="center">
        <Text
          fontSize="$xl"
          fontWeight="bold"
          color={rankColor}
          width={40}
          textAlign="center"
        >
          #{entry.rank}
        </Text>
        
        <Avatar size="$4" circular>
          <Avatar.Image src={entry.avatar} />
          <Avatar.Fallback backgroundColor="$neonBlue">
            <Text color="$white" fontWeight="bold">
              {entry.username[0].toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>
        
        <YStack flex={1} space="$1">
          <XStack space="$2" alignItems="center">
            <Text fontWeight="bold">{entry.username}</Text>
            {entry.isCurrentUser && (
              <Text fontSize="$sm" color="$neonBlue">(You)</Text>
            )}
          </XStack>
          
          <XStack space="$3">
            <Text fontSize="$sm" color="$textMuted">
              {entry.totalGames} games
            </Text>
            <Text fontSize="$sm" color="$textMuted">
              {entry.losses} losses
            </Text>
          </XStack>
        </YStack>
        
        <YStack alignItems="flex-end" space="$1">
          {activeTab === 'wins' || activeTab === 'weekly' || activeTab === 'monthly' ? (
            <Text fontSize="$lg" fontWeight="bold" color="$neonGreen">
              {entry.wins} wins
            </Text>
          ) : (
            <Text fontSize="$lg" fontWeight="bold" color="$neonYellow">
              {entry.winRate.toFixed(1)}%
            </Text>
          )}
          <XStack space="$2">
            <Text fontSize="$xs" color="$textMuted">
              W/L: {entry.wins}/{entry.losses}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}