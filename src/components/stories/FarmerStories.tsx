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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Success Story: {selectedStory.farmerName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStory(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={selectedStory.image} 
                  alt={selectedStory.crop}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStory.avatar} />
                  <AvatarFallback>{selectedStory.farmerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStory.farmerName}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedStory.location}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span>⭐ {selectedStory.rating}</span>
                    <span>👥 {selectedStory.followers} followers</span>
                    <span>📅 {selectedStory.experience} experience</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">The Story</h4>
                <p className="text-muted-foreground leading-relaxed">{selectedStory.story}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-semibold text-green-800 mb-2">Earnings Growth</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Before:</span>
                      <span className="font-medium">{formatEarnings(selectedStory.beforeEarnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Now:</span>
                      <span className="font-bold text-green-600">{formatEarnings(selectedStory.earnings)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Growth:</span>
                      <span className="font-semibold text-green-600">
                        +{calculateGrowth(selectedStory.earnings, selectedStory.beforeEarnings)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-2">Key Tips</h5>
                  <ul className="space-y-1 text-sm">
                    {selectedStory.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Farmer
                </Button>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 