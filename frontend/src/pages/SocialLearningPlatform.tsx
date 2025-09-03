
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Users, 
  BookOpen, 
  Star, 
  Award, 
  Target,
  TrendingUp,
  Medal,
  Play,
  Check,
  Clock,
  MessageCircle
} from 'lucide-react';

const learningPaths = [
  {
    id: 1,
    title: 'Sustainable Farming Mastery',
    description: 'Complete course on eco-friendly farming practices',
    level: 'Intermediate',
    progress: 68,
    modules: 12,
    completed: 8,
    points: 450,
    badge: 'Eco Warrior',
    enrolled: 1247
  },
  {
    id: 2,
    title: 'Precision Agriculture Techniques',
    description: 'Advanced technology integration in farming',
    level: 'Advanced',
    progress: 23,
    modules: 15,
    completed: 3,
    points: 680,
    badge: 'Tech Pioneer',
    enrolled: 892
  },
  {
    id: 3,
    title: 'Crop Disease Management',
    description: 'Identification and treatment of plant diseases',
    level: 'Beginner',
    progress: 100,
    modules: 8,
    completed: 8,
    points: 320,
    badge: 'Plant Doctor',
    enrolled: 2156
  }
];

const leaderboard = [
  { rank: 1, name: 'Sarah Johnson', points: 2840, badges: 12, location: 'Northern Region' },
  { rank: 2, name: 'Michael Chen', points: 2650, badges: 10, location: 'Eastern Valley' },
  { rank: 3, name: 'Emma Williams', points: 2420, badges: 9, location: 'Southern Hills' },
  { rank: 4, name: 'You', points: 1950, badges: 7, location: 'Central Plains' },
  { rank: 5, name: 'David Brown', points: 1820, badges: 6, location: 'Western Farms' }
];

const challenges = [
  {
    title: 'Water Conservation Challenge',
    description: 'Reduce water usage by 20% this month',
    timeLeft: '12 days',
    participants: 156,
    reward: 200,
    difficulty: 'Medium',
    progress: 67
  },
  {
    title: 'Zero Waste Farming',
    description: 'Implement circular farming practices',
    timeLeft: '25 days',
    participants: 89,
    reward: 350,
    difficulty: 'Hard',
    progress: 34
  },
  {
    title: 'Biodiversity Boost',
    description: 'Increase native species on your farm',
    timeLeft: '8 days',
    participants: 203,
    reward: 150,
    difficulty: 'Easy',
    progress: 89
  }
];

const achievements = [
  { name: 'First Steps', icon: Award, earned: true, description: 'Complete your first course' },
  { name: 'Knowledge Seeker', icon: BookOpen, earned: true, description: 'Complete 5 learning modules' },
  { name: 'Challenge Champion', icon: Trophy, earned: true, description: 'Win your first challenge' },
  { name: 'Community Helper', icon: Users, earned: false, description: 'Help 10 fellow farmers' },
  { name: 'Innovation Leader', icon: TrendingUp, earned: false, description: 'Share 5 farming innovations' },
  { name: 'Sustainability Master', icon: Target, earned: false, description: 'Complete all eco-courses' }
];

export default function SocialLearningPlatform() {
  const [activeTab, setActiveTab] = useState('courses');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Social Learning Platform
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Learn, compete, and grow with fellow farmers in our gamified learning community
          </p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">1,950</div>
              <p className="text-sm text-muted-foreground">Learning Points</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Medal className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">7</div>
              <p className="text-sm text-muted-foreground">Badges Earned</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">4th</div>
              <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">23</div>
              <p className="text-sm text-muted-foreground">Courses Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['courses', 'challenges', 'leaderboard', 'achievements'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Learning Courses Tab */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {learningPaths.map((course) => (
              <Card key={course.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription className="mt-1">{course.description}</CardDescription>
                    </div>
                    <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{course.progress}% ({course.completed}/{course.modules} modules)</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-primary">{course.points}</div>
                      <div className="text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{course.enrolled}</div>
                      <div className="text-muted-foreground">Enrolled</div>
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">{course.badge}</Badge>
                      <div className="text-muted-foreground text-xs mt-1">Badge</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Discuss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            {challenges.map((challenge, idx) => (
              <Card key={idx} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{challenge.title}</h3>
                      <p className="text-muted-foreground text-sm">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{challenge.reward} pts</div>
                      <div className={`text-sm ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{challenge.timeLeft} left</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{challenge.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{challenge.progress}% complete</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Progress value={challenge.progress} className="h-2" />
                  </div>
                  
                  <Button className="w-full md:w-auto">
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Community Leaderboard</CardTitle>
              <CardDescription>Top learners in your region</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((user) => (
                  <div key={user.rank} className={`flex items-center gap-4 p-3 rounded-lg ${
                    user.name === 'You' ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      user.rank === 1 ? 'bg-yellow-500 text-white' :
                      user.rank === 2 ? 'bg-gray-400 text-white' :
                      user.rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {user.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{user.points.toLocaleString()} pts</div>
                      <div className="text-sm text-muted-foreground">{user.badges} badges</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, idx) => {
              const Icon = achievement.icon;
              return (
                <Card key={idx} className={`shadow-soft ${achievement.earned ? 'border-primary bg-primary/5' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      achievement.earned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                    {achievement.earned ? (
                      <Badge className="bg-green-500 text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Earned</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
