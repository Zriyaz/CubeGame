import { useState, useEffect } from 'react';
import { YStack, XStack, Stack, Text, ScrollView, Avatar, Progress, Spinner } from 'tamagui';
import { Trophy, Target, TrendingUp, Clock, Award, Edit2, Camera } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUser';

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalCellsCaptured: number;
  avgCellsPerGame: number;
  longestWinStreak: number;
  currentStreak: number;
  favoriteColor: string;
  totalPlayTime: number; // in minutes
  rank: string;
  xp: number;
  xpToNextLevel: number;
  level: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const { data: profileData, isLoading } = useUserProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // Update local state when profile data loads
  useEffect(() => {
    if (profileData?.user) {
      setDisplayName(profileData.user.name);
      setSelectedColor(profileData.user.preferred_color || '#00FFCC');
    }
  }, [profileData]);
  
  // Use real stats from API or defaults
  const stats: UserStats = {
    gamesPlayed: profileData?.stats?.totalGames ?? 0,
    gamesWon: profileData?.stats?.gamesWon ?? 0,
    winRate: profileData?.stats?.winRate ?? 0,
    totalCellsCaptured: profileData?.stats?.totalCellsCaptured ?? 0,
    avgCellsPerGame: profileData?.stats?.averageCellsPerGame ?? 0,
    longestWinStreak: profileData?.stats?.longestWinStreak ?? 0,
    currentStreak: profileData?.stats?.currentStreak ?? 0,
    totalPlayTime: profileData?.stats?.totalPlayTime ?? 0,
    rank: profileData?.stats?.rank || 'Beginner',
    level: profileData?.stats?.level ?? 1,
    favoriteColor: selectedColor || profileData?.user?.preferred_color || '#00FFCC',
    xp: 0,
    xpToNextLevel: 100,
  };
  
  // Calculate XP for display
  const xp = stats.level * 100;
  const xpToNextLevel = (stats.level + 1) * 100;

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      name: 'First Victory',
      description: 'Win your first game',
      icon: '🏆',
      unlocked: true,
    },
    {
      id: '2',
      name: 'Dominator',
      description: 'Capture 50+ cells in a single game',
      icon: '👑',
      unlocked: true,
    },
    {
      id: '3',
      name: 'Speed Demon',
      description: 'Win a game in under 2 minutes',
      icon: '⚡',
      unlocked: false,
      progress: 145,
      maxProgress: 120,
    },
    {
      id: '4',
      name: 'Unstoppable',
      description: 'Win 10 games in a row',
      icon: '🔥',
      unlocked: false,
      progress: 3,
      maxProgress: 10,
    },
    {
      id: '5',
      name: 'Grid Master',
      description: 'Reach level 50',
      icon: '🌟',
      unlocked: false,
      progress: 23,
      maxProgress: 50,
    },
    {
      id: '6',
      name: 'Social Butterfly',
      description: 'Play with 100 different players',
      icon: '🦋',
      unlocked: true,
    },
  ]);

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSaveProfile = () => {
    const updates: any = {};
    
    if (displayName !== profileData?.user.name) {
      updates.name = displayName;
    }
    
    if (selectedColor !== profileData?.user.preferred_color) {
      updates.preferred_color = selectedColor;
    }
    
    if (Object.keys(updates).length > 0) {
      updateProfile(updates, {
        onSuccess: () => {
          setIsEditing(false);
        },
      });
    } else {
      setIsEditing(false);
    }
  };

  const xpProgress = (xp / xpToNextLevel) * 100;
  
  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$neonBlue" />
        <Text marginTop="$4" color="$textMuted">Loading profile...</Text>
      </Stack>
    );
  }

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" space="$4" maxWidth={1000} margin="0 auto" width="100%">
        {/* Profile Header */}
        <Card variant="elevated" padding="$5">
          <XStack space="$4" alignItems="center" flexWrap="wrap">
            <Stack position="relative">
              <Avatar size="$10" circular borderWidth={4} borderColor={stats.favoriteColor}>
                <Avatar.Image src={user?.avatar_url} />
                <Avatar.Fallback backgroundColor={stats.favoriteColor}>
                  <Text color="$white" fontSize="$2xl" fontWeight="bold">
                    {displayName ? displayName[0].toUpperCase() : user?.name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              
              <Button
                size="$2"
                circular
                position="absolute"
                bottom={0}
                right={0}
                backgroundColor="$neonBlue"
                icon={<Camera size={16} />}
                onPress={() => {/* TODO: Change avatar */}}
              />
            </Stack>

            <YStack flex={1} space="$2">
              <XStack space="$2" alignItems="center">
                {isEditing ? (
                  <Input
                    value={displayName}
                    onChangeText={setDisplayName}
                    fontSize="$2xl"
                    fontWeight="bold"
                    borderWidth={0}
                    backgroundColor="transparent"
                    paddingHorizontal={0}
                  />
                ) : (
                  <Text fontSize="$2xl" fontWeight="bold">{displayName}</Text>
                )}
                
                {!isEditing && (
                  <Button
                    size="$1"
                    variant="ghost"
                    icon={<Edit2 size={16} />}
                    onPress={() => setIsEditing(true)}
                  />
                )}
              </XStack>

              <XStack space="$3" alignItems="center">
                <Stack
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  backgroundColor="$neonPink"
                  borderRadius="$sm"
                >
                  <Text fontSize="$sm" fontWeight="bold" color="$white">
                    {stats.rank}
                  </Text>
                </Stack>
                
                <Text fontSize="$sm" color="$textMuted">
                  Level {stats.level}
                </Text>
              </XStack>

              <YStack space="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$xs" color="$textMuted">
                    {stats.xp} / {stats.xpToNextLevel} XP
                  </Text>
                  <Text fontSize="$xs" color="$neonBlue">
                    {xpProgress.toFixed(0)}%
                  </Text>
                </XStack>
                <Progress value={xpProgress} backgroundColor="$surface" indicatorStyle={{ backgroundColor: '$neonBlue' }}>
                  <Progress.Indicator animation="quick" />
                </Progress>
              </YStack>

              {isEditing && (
                <XStack space="$2">
                  <Button size="$2" onPress={handleSaveProfile}>Save</Button>
                  <Button size="$2" variant="ghost" onPress={() => setIsEditing(false)}>Cancel</Button>
                </XStack>
              )}
            </YStack>
          </XStack>
        </Card>

        {/* Quick Stats */}
        <XStack space="$3" flexWrap="wrap">
          <QuickStatCard
            icon={<Trophy />}
            value={stats.gamesWon}
            label="Victories"
            color="$neonYellow"
          />
          <QuickStatCard
            icon={<Target />}
            value={`${stats.winRate}%`}
            label="Win Rate"
            color="$success"
          />
          <QuickStatCard
            icon={<TrendingUp />}
            value={stats.currentStreak}
            label="Current Streak"
            color="$neonPink"
          />
          <QuickStatCard
            icon={<Clock />}
            value={formatPlayTime(stats.totalPlayTime)}
            label="Play Time"
            color="$neonBlue"
          />
        </XStack>

        {/* Detailed Stats */}
        <Card variant="elevated" padding="$4" space="$4">
          <Text fontSize="$lg" fontWeight="bold">Detailed Statistics</Text>
          
          <YStack space="$3">
            <StatRow label="Games Played" value={stats.gamesPlayed} />
            <StatRow label="Total Cells Captured" value={stats.totalCellsCaptured.toLocaleString()} />
            <StatRow label="Average Cells per Game" value={stats.avgCellsPerGame.toFixed(1)} />
            <StatRow label="Longest Win Streak" value={stats.longestWinStreak} highlight />
            <StatRow label="Favorite Color" value={
              <Stack width={20} height={20} backgroundColor={stats.favoriteColor} borderRadius={10} />
            } />
          </YStack>
        </Card>

        {/* Achievements */}
        <Card variant="elevated" padding="$4" space="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$lg" fontWeight="bold">Achievements</Text>
            <Text fontSize="$sm" color="$neonGreen">
              {achievements.filter(a => a.unlocked).length}/{achievements.length}
            </Text>
          </XStack>
          
          <YStack space="$3">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

function QuickStatCard({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: React.ReactNode; 
  value: string | number; 
  label: string; 
  color: string;
}) {
  return (
    <Card flex={1} minWidth={150} variant="outlined" padding="$3" alignItems="center" space="$2">
      <Stack color={color}>{icon}</Stack>
      <Text fontSize="$2xl" fontWeight="bold" color={color}>{value}</Text>
      <Text fontSize="$xs" color="$textMuted">{label}</Text>
    </Card>
  );
}

function StatRow({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: React.ReactNode; 
  highlight?: boolean;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <Text color="$textMuted">{label}</Text>
      <Text fontWeight="bold" color={highlight ? '$neonGreen' : undefined}>
        {value}
      </Text>
    </XStack>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card
      padding="$3"
      backgroundColor={achievement.unlocked ? '$surface' : '$background'}
      opacity={achievement.unlocked ? 1 : 0.6}
    >
      <XStack space="$3" alignItems="center">
        <Text fontSize={32}>{achievement.icon}</Text>
        
        <YStack flex={1} space="$1">
          <XStack space="$2" alignItems="center">
            <Text fontWeight="bold">{achievement.name}</Text>
            {achievement.unlocked && (
              <Award size={16} color="$neonYellow" />
            )}
          </XStack>
          <Text fontSize="$sm" color="$textMuted">{achievement.description}</Text>
          
          {!achievement.unlocked && achievement.progress !== undefined && (
            <YStack space="$1">
              <Progress 
                value={(achievement.progress / achievement.maxProgress!) * 100} 
                backgroundColor="$surface"
                height={4}
              >
                <Progress.Indicator 
                  animation="quick" 
                  backgroundColor="$neonBlue"
                />
              </Progress>
              <Text fontSize="$xs" color="$textMuted">
                {achievement.progress}/{achievement.maxProgress}
              </Text>
            </YStack>
          )}
        </YStack>
        
        {achievement.unlocked && (
          <Stack
            backgroundColor="$neonYellow"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$sm"
          >
            <Text fontSize="$xs" fontWeight="bold" color="$black">UNLOCKED</Text>
          </Stack>
        )}
      </XStack>
    </Card>
  );
}