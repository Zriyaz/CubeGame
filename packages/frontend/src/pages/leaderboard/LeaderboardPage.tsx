import { useState } from 'react';
import { YStack, XStack, Stack, Text, ScrollView, Avatar, Tabs, Spinner } from 'tamagui';
import { Trophy, TrendingUp, Crown, Medal, Award, Percent, Flame, Target } from 'lucide-react';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useLeaderboard, useWeeklyLeaderboard, useMonthlyLeaderboard } from '@/hooks/useLeaderboard';
import type { LeaderboardEntry as APILeaderboardEntry } from '@/api/leaderboard.api';

interface LeaderboardEntry extends APILeaderboardEntry {
  rank: number;
  isCurrentUser?: boolean;
}

type LeaderboardType = 'wins' | 'winRate' | 'weekly' | 'monthly';

export function LeaderboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('wins');
  const [limit] = useState(50);

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

  // Debug log to check API response
  console.log('Leaderboard data:', activeTab, leaderboardData);

  // Add rank and check if current user
  const rankedLeaderboard: LeaderboardEntry[] = Array.isArray(leaderboardData)
    ? leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: entry.userId === user?.id
    }))
    : [];

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
    <Stack flex={1} backgroundColor="$background">
      <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
        <Stack flex={1} alignItems="center" width="100%">
          <YStack padding="$5" gap="$6" width="100%" maxWidth={1200}>
            {/* Page Header */}
            <YStack gap="$3" marginBottom="$2">
              <Text
                fontSize={48}
                fontWeight="900"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  background: 'linear-gradient(135deg, #FFDD00 0%, #FF6B00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255, 221, 0, 0.5)',
                }}
              >
                LEADERBOARD
              </Text>
              <Text
                fontSize={18}
                color="$textMuted"
                opacity={0.8}
                style={{ fontFamily: 'Rajdhani, monospace' }}
              >
                Compete for glory and dominate the rankings
              </Text>
            </YStack>

            {/* Your Position Card */}
            {currentUserEntry && (
              <Card
                padding="$5"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(0, 212, 255, 0.5)',
                  borderWidth: 2,
                }}
              >
                <XStack gap="$4" alignItems="center">
                  <Stack
                    padding="$4"
                    borderRadius={20}
                    style={{
                      background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                      boxShadow: '0 0 30px rgba(0, 212, 255, 0.6)',
                    }}
                  >
                    <Text fontSize={48} fontWeight="900" color="$white">
                      #{currentUserEntry.rank}
                    </Text>
                  </Stack>

                  <YStack flex={1} gap="$2">
                    <Text
                      fontSize={24}
                      fontWeight="bold"
                      style={{ fontFamily: 'Orbitron, monospace' }}
                    >
                      YOUR POSITION
                    </Text>
                    <XStack gap="$5">
                      <XStack gap="$2" alignItems="center">
                        <Trophy size={16} color="#00FF88" />
                        <Text fontSize={16} color="$textMuted">
                          Wins: <Text color="$neonGreen" fontWeight="bold">{currentUserEntry.wins}</Text>
                        </Text>
                      </XStack>
                      <XStack gap="$2" alignItems="center">
                        <Target size={16} color="#FF0080" />
                        <Text fontSize={16} color="$textMuted">
                          Games: <Text color="$neonPink" fontWeight="bold">{currentUserEntry.totalGames}</Text>
                        </Text>
                      </XStack>
                      <XStack gap="$2" alignItems="center">
                        <Percent size={16} color="#FFDD00" />
                        <Text fontSize={16} color="$textMuted">
                          Win Rate: <Text color="$neonYellow" fontWeight="bold">{currentUserEntry.winRate.toFixed(1)}%</Text>
                        </Text>
                      </XStack>
                    </XStack>
                  </YStack>

                  <Trophy
                    size={60}
                    color="#00D4FF"
                    style={{
                      filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.6))',
                    }}
                  />
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
              <Tabs.List
                backgroundColor="rgba(18, 18, 26, 0.6)"
                borderRadius={12}
                padding={4}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Tabs.Trigger value="wins" flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <Trophy size={18} />
                    <Text fontWeight="bold">Most Wins</Text>
                  </XStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="winRate" flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <Percent size={18} />
                    <Text fontWeight="bold">Win Rate</Text>
                  </XStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="weekly" flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <TrendingUp size={18} />
                    <Text fontWeight="bold">This Week</Text>
                  </XStack>
                </Tabs.Trigger>
                <Tabs.Trigger value="monthly" flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <Award size={18} />
                    <Text fontWeight="bold">This Month</Text>
                  </XStack>
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value={activeTab} paddingTop="$6">
                <YStack gap="$6">
                  {/* Top 3 Podium */}
                  {rankedLeaderboard.length >= 3 && (
                    <XStack justifyContent="center" alignItems="flex-end" gap="$3" paddingVertical="$4">
                      {/* 2nd Place */}
                      <PodiumCard
                        entry={rankedLeaderboard[1]}
                        height={120}
                        color="#C0C0C0"
                        glow="rgba(192, 192, 192, 0.5)"
                      />

                      {/* 1st Place */}
                      <PodiumCard
                        entry={rankedLeaderboard[0]}
                        height={150}
                        color="#FFD700"
                        glow="rgba(255, 215, 0, 0.6)"
                      />

                      {/* 3rd Place */}
                      <PodiumCard
                        entry={rankedLeaderboard[2]}
                        height={90}
                        color="#CD7F32"
                        glow="rgba(205, 127, 50, 0.4)"
                      />
                    </XStack>
                  )}

                  {/* Full Leaderboard */}
                  <YStack gap="$3">
                    {rankedLeaderboard.length > 0 ? (
                      rankedLeaderboard.map((entry) => (
                        <LeaderboardCard
                          key={entry.userId}
                          entry={entry}
                          activeTab={activeTab}
                        />
                      ))
                    ) : (
                      <Stack alignItems="center" padding="$8">
                        <Text fontSize={18} color="$textMuted">
                          No leaderboard data available yet
                        </Text>
                      </Stack>
                    )}
                  </YStack>
                </YStack>
              </Tabs.Content>
            </Tabs>
          </YStack>
        </Stack>
      </ScrollView>
    </Stack>
  );
}

function PodiumCard({
  entry,
  height,
  color,
  glow
}: {
  entry: LeaderboardEntry;
  height: number;
  color: string;
  glow: string;
}) {
  const medal = entry.rank === 1 ? <Crown size={36} /> :
    entry.rank === 2 ? <Medal size={32} /> :
      <Award size={28} />;

  return (
    <YStack alignItems="center" gap="$3">
      <Avatar
        size="$6"
        circular
        style={{
          borderWidth: 3,
          borderColor: color,
          boxShadow: `0 0 30px ${glow}`,
        }}
      >
        <Avatar.Image src={entry.avatar || undefined} />
        <Avatar.Fallback
          backgroundColor={color}
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          }}
        >
          <Text color="$black" fontWeight="900" fontSize={24}>
            {entry.username[0].toUpperCase()}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      <YStack alignItems="center" gap="$1">
        <Text
          fontWeight="bold"
          fontSize={16}
          style={{ fontFamily: 'Rajdhani, monospace' }}
        >
          {entry.username}
        </Text>
        <Text fontSize={14} color="$neonGreen" fontWeight="bold">
          {entry.wins} wins
        </Text>
      </YStack>

      <Stack
        height={height}
        width={100}
        borderTopLeftRadius={12}
        borderTopRightRadius={12}
        alignItems="center"
        justifyContent="center"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, ${color}BB 100%)`,
          boxShadow: `0 -10px 40px ${glow}, inset 0 2px 0 rgba(255, 255, 255, 0.2)`,
        }}
      >
        <Stack color="$black" marginBottom="$2">
          {medal}
        </Stack>
        <Text
          fontSize={36}
          fontWeight="900"
          color="$black"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          {entry.rank}
        </Text>
      </Stack>
    </YStack>
  );
}

function LeaderboardCard({
  entry,
  activeTab
}: {
  entry: LeaderboardEntry;
  activeTab: LeaderboardType;
}) {
  const rankColor = entry.rank === 1 ? '#FFD700' :
    entry.rank === 2 ? '#C0C0C0' :
      entry.rank === 3 ? '#CD7F32' : '#B8B8C8';

  const getRankIcon = () => {
    if (entry.rank === 1) return <Crown size={20} color={rankColor} />;
    if (entry.rank === 2) return <Medal size={20} color={rankColor} />;
    if (entry.rank === 3) return <Award size={20} color={rankColor} />;
    return null;
  };

  return (
    <Card
      padding="$4"
      style={{
        background: entry.isCurrentUser
          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(18, 18, 26, 0.6) 0%, rgba(10, 10, 15, 0.6) 100%)',
        boxShadow: entry.isCurrentUser
          ? '0 4px 20px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        borderWidth: entry.isCurrentUser ? 2 : 1,
        borderColor: entry.isCurrentUser ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 255, 255, 0.05)',
        borderStyle: 'solid',
      }}
    >
      <XStack gap="$4" alignItems="center">
        <XStack alignItems="center" gap="$2" width={80}>
          {getRankIcon()}
          <Text
            fontSize={24}
            fontWeight="900"
            color={rankColor}
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            #{entry.rank}
          </Text>
        </XStack>

        <Avatar size="$4" circular>
          <Avatar.Image src={entry.avatar || undefined} />
          <Avatar.Fallback
            style={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
            }}
          >
            <Text color="$white" fontWeight="bold">
              {entry.username[0].toUpperCase()}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1} gap="$1">
          <XStack gap="$2" alignItems="center">
            <Text
              fontWeight="bold"
              fontSize={18}
              style={{ fontFamily: 'Rajdhani, monospace' }}
            >
              {entry.username}
            </Text>
            {entry.isCurrentUser && (
              <Stack
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius={6}
                style={{
                  background: 'rgba(0, 212, 255, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 212, 255, 0.4)',
                }}
              >
                <Text fontSize={12} color="$neonBlue" fontWeight="bold">YOU</Text>
              </Stack>
            )}
          </XStack>

          <XStack gap="$3">
            <Text fontSize={14} color="$textMuted">
              <Flame size={14} color="#FF6B00" style={{ marginRight: 4 }} />
              {entry.totalGames} games
            </Text>
            <Text fontSize={14} color="$textMuted">
              W/L: {entry.wins}/{entry.losses}
            </Text>
          </XStack>
        </YStack>

        <YStack alignItems="flex-end" gap="$1">
          {activeTab === 'wins' || activeTab === 'weekly' || activeTab === 'monthly' ? (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={8}
              style={{
                background: 'rgba(0, 255, 136, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(0, 255, 136, 0.4)',
              }}
            >
              <Text fontSize={20} fontWeight="900" color="$neonGreen">
                {entry.wins} WINS
              </Text>
            </Stack>
          ) : (
            <Stack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={8}
              style={{
                background: 'rgba(255, 221, 0, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255, 221, 0, 0.4)',
              }}
            >
              <Text fontSize={20} fontWeight="900" color="$neonYellow">
                {entry.winRate.toFixed(1)}%
              </Text>
            </Stack>
          )}
          <Text fontSize={12} color="$textMuted" opacity={0.7}>
            Win Rate: {entry.winRate.toFixed(1)}%
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}