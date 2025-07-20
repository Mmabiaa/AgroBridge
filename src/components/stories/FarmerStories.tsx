import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  MapPin,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';

interface FarmerStory {
  id: string;
  farmerName: string;
  location: string;
  crop: string;
  story: string;
  tips: string[];
  earnings: number;
  beforeEarnings: number;
  image: string;
  avatar: string;
  rating: number;
  followers: number;
  experience: string;
  date: string;
  likes: number;
  comments: number;
}

const farmerStories: FarmerStory[] = [
  {
    id: '1',
    farmerName: 'Kwame Asante',
    location: 'Kumasi, Ashanti Region',
    crop: 'Tomatoes',
    story: 'I started with just 2 acres of tomatoes. Through proper irrigation and organic pest control, I now manage 15 acres and supply to major markets in Kumasi. The key was learning from other farmers and using technology to track market prices.',
    tips: [
      'Invest in drip irrigation for consistent water supply',
      'Use organic pest control methods to maintain quality',
      'Build relationships with reliable buyers',
      'Track market prices daily to sell at optimal times'
    ],
    earnings: 450000,
    beforeEarnings: 120000,
    image: 'https://i.pinimg.com/736x/4e/d6/fe/4ed6feb64a7f21255f3f9d9174509cd9.jpg',
    avatar: 'https://i.pinimg.com/736x/1a/2b/3c/1a2b3c4d5e6f7g8h9i0j.jpg',
    rating: 4.8,
    followers: 1250,
    experience: '8 years',
    date: '2024-01-15',
    likes: 89,
    comments: 23
  },
  {
    id: '2',
    farmerName: 'Fatima Ibrahim',
    location: 'Tamale, Northern Region',
    crop: 'Maize',
    story: 'Growing up in a farming family, I learned early that maize farming requires patience and proper planning. I now produce over 50 tons annually and help other women farmers in my community improve their yields.',
    tips: [
      'Plant early in the season to avoid drought stress',
      'Use certified seeds for better germination rates',
      'Practice crop rotation to maintain soil health',
      'Join farmer groups for better market access'
    ],
    earnings: 320000,
    beforeEarnings: 80000,
    image: 'https://i.pinimg.com/736x/45/7d/f3/457df3e0fc340a8eef6a52e4e8964a31.jpg',
    avatar: 'https://i.pinimg.com/736x/2b/3c/4d/2b3c4d5e6f7g8h9i0j1k.jpg',
    rating: 4.9,
    followers: 890,
    experience: '12 years',
    date: '2024-01-12',
    likes: 156,
    comments: 34
  },
  {
    id: '3',
    farmerName: 'Grace Mensah',
    location: 'Cape Coast, Central Region',
    crop: 'Pineapples',
    story: 'I discovered that pineapples grow exceptionally well in our coastal climate. By focusing on organic methods and building direct relationships with exporters, I\'ve created a sustainable business that supports my entire family.',
    tips: [
      'Choose the right variety for your climate',
      'Maintain proper spacing for optimal growth',
      'Harvest at the right stage for best flavor',
      'Build direct relationships with buyers'
    ],
    earnings: 280000,
    beforeEarnings: 60000,
    image: 'https://i.pinimg.com/736x/4d/90/47/4d9047453cd1cad8452d6d085e0365b5.jpg',
    avatar: 'https://i.pinimg.com/736x/3c/4d/5e/3c4d5e6f7g8h9i0j1k2l.jpg',
    rating: 4.7,
    followers: 670,
    experience: '6 years',
    date: '2024-01-10',
    likes: 78,
    comments: 19
  }
];

export function FarmerStories() {
  const [selectedStory, setSelectedStory] = useState<FarmerStory | null>(null);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());

  const handleLike = (storyId: string) => {
    setLikedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const formatEarnings = (amount: number) => {
    return `₵${amount.toLocaleString()}`;
  };

  const calculateGrowth = (current: number, previous: number) => {
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Success Stories from Our Farmers
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Learn from real farmers who have transformed their lives through smart farming
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farmerStories.map((story) => (
          <Card key={story.id} className="shadow-soft hover:shadow-strong transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img 
                  src={story.image} 
                  alt={story.crop}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={story.avatar} />
                  <AvatarFallback>{story.farmerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{story.farmerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{story.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{story.rating}</span>
                </div>
                <Badge variant="secondary">{story.crop}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {story.story}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Earnings</p>
                    <p className="text-lg font-bold text-green-600">{formatEarnings(story.earnings)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Growth</p>
                    <p className="text-sm font-semibold text-green-600">
                      +{calculateGrowth(story.earnings, story.beforeEarnings)}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Experience: {story.experience}</span>
                  <span>{story.followers} followers</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => handleLike(story.id)}
                    className={`flex items-center gap-1 transition-colors ${
                      likedStories.has(story.id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${likedStories.has(story.id) ? 'fill-current' : ''}`} />
                    <span>{story.likes + (likedStories.has(story.id) ? 1 : 0)}</span>
                  </button>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{story.comments}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStory(story)}
                >
                  Read Full Story
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Story Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      {selectedStory.farmerName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Success Story • {new Date(selectedStory.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStory(null)}
                  className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors"
                >
                  <span className="text-xl">×</span>
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <CardContent className="p-0">
                {/* Hero Section */}
                <div className="relative">
                  <div className="aspect-video bg-gradient-to-br from-green-400 to-blue-500 relative overflow-hidden">
                    <img 
                      src={selectedStory.image} 
                      alt={selectedStory.crop}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge className="bg-white/90 text-gray-800 border-0 px-3 py-1 text-sm font-semibold">
                        🌱 {selectedStory.crop} Farmer
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Farmer Profile Section */}
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={selectedStory.avatar} />
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-green-400 to-blue-500 text-white">
                        {selectedStory.farmerName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedStory.farmerName}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{selectedStory.location}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-700">{selectedStory.rating}</span>
                          <span className="text-gray-500">rating</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-gray-700">{selectedStory.followers}</span>
                          <span className="text-gray-500">followers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span className="font-semibold text-gray-700">{selectedStory.experience}</span>
                          <span className="text-gray-500">experience</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Story Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></div>
                      <h4 className="text-xl font-bold text-gray-800">The Success Journey</h4>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-400">
                      <p className="text-gray-700 leading-relaxed text-base">
                        {selectedStory.story}
                      </p>
                    </div>
                  </div>

                  {/* Earnings & Tips Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Earnings Growth */}
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <h5 className="text-lg font-bold text-green-800">Earnings Growth</h5>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                          <span className="text-sm font-medium text-gray-600">Before:</span>
                          <span className="font-bold text-gray-700">{formatEarnings(selectedStory.beforeEarnings)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                          <span className="text-sm font-medium text-green-700">Now:</span>
                          <span className="font-bold text-green-800 text-lg">{formatEarnings(selectedStory.earnings)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                          <span className="text-sm font-medium text-green-700">Growth:</span>
                          <span className="font-bold text-green-800 text-lg">
                            +{calculateGrowth(selectedStory.earnings, selectedStory.beforeEarnings)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Tips */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Star className="h-5 w-5 text-blue-600" />
                        </div>
                        <h5 className="text-lg font-bold text-blue-800">Key Success Tips</h5>
                      </div>
                      <ul className="space-y-3">
                        {selectedStory.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                              <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                            </div>
                            <span className="text-gray-700 leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact Farmer
                    </Button>
                    <Button variant="outline" className="flex-1 border-2 border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold py-3">
                      <Share2 className="h-5 w-5 mr-2" />
                      Share Story
                    </Button>
                  </div>

                  {/* Social Stats */}
                  <div className="flex items-center justify-center gap-8 py-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{selectedStory.likes}</div>
                      <div className="text-sm text-gray-600">Likes</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{selectedStory.comments}</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{selectedStory.followers}</div>
                      <div className="text-sm text-gray-600">Followers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 