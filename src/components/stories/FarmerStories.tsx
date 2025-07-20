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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <Card className="max-w-5xl w-full max-h-[98vh] overflow-hidden shadow-2xl border-0 bg-white">
            {/* Enhanced Header */}
            <CardHeader className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-white mb-1">
                      {selectedStory.farmerName}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-white/90">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {selectedStory.location}
                      </span>
                      <span>•</span>
                      <span>{new Date(selectedStory.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStory(null)}
                  className="h-12 w-12 rounded-full hover:bg-white/20 text-white transition-all duration-200"
                >
                  <span className="text-2xl">×</span>
                </Button>
              </div>
            </CardHeader>
            
            <div className="overflow-y-auto max-h-[calc(98vh-120px)]">
              <CardContent className="p-0">
                {/* Enhanced Hero Section */}
                <div className="relative">
                  <div className="aspect-[16/9] bg-gradient-to-br from-green-400 to-blue-500 relative overflow-hidden">
                    <img 
                      src={selectedStory.image} 
                      alt={selectedStory.crop}
                      className="w-full h-full object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-white/95 text-gray-800 border-0 px-4 py-2 text-base font-bold shadow-lg">
                          🌱 {selectedStory.crop} Specialist
                        </Badge>
                        <div className="flex items-center gap-3">
                          <div className="bg-white/90 rounded-full px-3 py-1 text-sm font-semibold text-gray-800">
                            ⭐ {selectedStory.rating}
                          </div>
                          <div className="bg-white/90 rounded-full px-3 py-1 text-sm font-semibold text-gray-800">
                            👥 {selectedStory.followers}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Enhanced Farmer Profile Section */}
                  <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-sm">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                      <AvatarImage src={selectedStory.avatar} />
                      <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-emerald-400 to-blue-500 text-white">
                        {selectedStory.farmerName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">{selectedStory.farmerName}</h3>
                      <div className="flex items-center gap-2 text-gray-600 mb-4">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        <span className="font-semibold text-lg">{selectedStory.location}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg text-gray-800">{selectedStory.rating}</span>
                          </div>
                          <div className="text-xs text-gray-600">Rating</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-bold text-lg text-gray-800">{selectedStory.followers}</span>
                          </div>
                          <div className="text-xs text-gray-600">Followers</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="font-bold text-lg text-gray-800">{selectedStory.experience}</span>
                          </div>
                          <div className="text-xs text-gray-600">Experience</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Story Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full"></div>
                      <h4 className="text-2xl font-bold text-gray-800">Success Journey</h4>
                    </div>
                    <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border-l-4 border-emerald-400 shadow-sm">
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {selectedStory.story}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Earnings & Tips Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Enhanced Earnings Growth */}
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h5 className="text-xl font-bold text-emerald-800">Financial Growth</h5>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-600">Starting Point</span>
                          </div>
                          <span className="font-bold text-lg text-gray-700">{formatEarnings(selectedStory.beforeEarnings)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-emerald-100 rounded-xl border border-emerald-200 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-emerald-700">Current Success</span>
                          </div>
                          <span className="font-bold text-xl text-emerald-800">{formatEarnings(selectedStory.earnings)}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl border border-emerald-300 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                            <span className="text-sm font-semibold text-green-700">Growth Achieved</span>
                          </div>
                          <span className="font-bold text-xl text-green-800">
                            +{calculateGrowth(selectedStory.earnings, selectedStory.beforeEarnings)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Key Tips */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Star className="h-6 w-6 text-blue-600" />
                        </div>
                        <h5 className="text-xl font-bold text-blue-800">Success Strategies</h5>
                      </div>
                      <ul className="space-y-4">
                        {selectedStory.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mt-0.5 shadow-sm">
                              <span className="text-white font-bold text-sm">{index + 1}</span>
                            </div>
                            <span className="text-gray-700 leading-relaxed text-base">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
                    <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                      <MessageCircle className="h-6 w-6 mr-3" />
                      Connect with Farmer
                    </Button>
                    <Button variant="outline" className="flex-1 border-2 border-blue-200 hover:bg-blue-50 text-blue-700 font-bold py-4 text-lg hover:shadow-lg transition-all duration-200">
                      <Share2 className="h-6 w-6 mr-3" />
                      Share Success Story
                    </Button>
                  </div>

                  {/* Enhanced Social Stats */}
                  <div className="grid grid-cols-3 gap-4 py-6 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800 mb-1">{selectedStory.likes}</div>
                      <div className="text-sm text-gray-600 font-medium">Likes</div>
                    </div>
                    <div className="text-center border-l border-r border-gray-300">
                      <div className="text-3xl font-bold text-gray-800 mb-1">{selectedStory.comments}</div>
                      <div className="text-sm text-gray-600 font-medium">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800 mb-1">{selectedStory.followers}</div>
                      <div className="text-sm text-gray-600 font-medium">Followers</div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200">
                    <h6 className="text-lg font-bold text-gray-800 mb-2">Inspired by this story?</h6>
                    <p className="text-gray-600 mb-4">Join our community and start your own success journey!</p>
                    <Button className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold px-8 py-3">
                      Join AgroBridge Community
                    </Button>
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