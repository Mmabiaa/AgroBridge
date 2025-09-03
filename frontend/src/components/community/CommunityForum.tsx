
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Star, 
  Calendar,
  Users,
  Plus,
  Search,
  Filter,
  Clock,
  Pin,
  BookOpen
} from 'lucide-react';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  avatar: string;
  category: string;
  likes: number;
  replies: number;
  views: number;
  createdAt: string;
  isPinned: boolean;
  tags: string[];
}

interface Expert {
  id: string;
  name: string;
  title: string;
  specialization: string;
  rating: number;
  avatar: string;
  isOnline: boolean;
  responseTime: string;
}

const forumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Best fertilizer schedule for tomatoes in dry season?',
    content: 'I\'m planning my tomato cultivation for the upcoming dry season. What would be the optimal fertilizer schedule? I have access to both organic and synthetic options.',
    author: 'John Farmer',
    authorRole: 'Farmer',
    avatar: '/placeholder.svg',
    category: 'Crop Management',
    likes: 15,
    replies: 8,
    views: 124,
    createdAt: '2025-01-15T10:30:00Z',
    isPinned: false,
    tags: ['tomatoes', 'fertilizer', 'dry-season']
  },
  {
    id: '2',
    title: 'Organic pest control methods for maize',
    content: 'Looking for effective organic methods to control fall armyworm in maize. Chemical pesticides are getting expensive and I want to go organic.',
    author: 'Grace Mensah',
    authorRole: 'Organic Farmer',
    avatar: '/placeholder.svg',
    category: 'Pest Control',
    likes: 23,
    replies: 12,
    views: 200,
    createdAt: '2024-01-14T16:45:00Z',
    isPinned: true,
    tags: ['maize', 'organic', 'pest-control', 'fall-armyworm']
  },
  {
    id: '3',
    title: 'Market prices discussion - Onion shortage impact',
    content: 'With the recent onion shortage, prices have spiked to ₦400/kg. How are other farmers adapting? Are you switching to other crops?',
    author: 'Samuel Osei',
    authorRole: 'Commercial Farmer',
    avatar: '/placeholder.svg',
    category: 'Market Discussion',
    likes: 31,
    replies: 18,
    views: 345,
    createdAt: '2024-01-13T09:15:00Z',
    isPinned: false,
    tags: ['onions', 'market-prices', 'shortage']
  }
];

const experts: Expert[] = [
  {
    id: '1',
    name: 'Dr. Kwame Asante',
    title: 'Agricultural Extension Officer',
    specialization: 'Crop Disease Management',
    rating: 4.9,
    avatar: '/placeholder.svg',
    isOnline: true,
    responseTime: '< 2 hours'
  },
  {
    id: '2',
    name: 'Prof. Akosua Frimpong',
    title: 'Soil Science Researcher',
    specialization: 'Soil Health & Fertility',
    rating: 4.8,
    avatar: '/placeholder.svg',
    isOnline: false,
    responseTime: '< 6 hours'
  },
  {
    id: '3',
    name: 'Joseph Tetteh',
    title: 'Organic Farming Consultant',
    specialization: 'Sustainable Agriculture',
    rating: 4.7,
    avatar: '/placeholder.svg',
    isOnline: true,
    responseTime: '< 1 hour'
  }
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Integrated Pest Management Workshop',
    date: '2025-07-25',
    location: 'Kumasi Agricultural College',
    attendees: 45,
    type: 'Workshop'
  },
  {
    id: '2',
    title: 'Organic Certification Seminar',
    date: '2025-08-28',
    location: 'Online',
    attendees: 120,
    type: 'Seminar'
  },
  {
    id: '3',
    title: 'Climate-Smart Agriculture Training',
    date: '2025-09-02',
    location: 'Tamale Training Center',
    attendees: 75,
    type: 'Training'
  }
];

export function CommunityForum() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '', tags: '' });

  const filteredPosts = forumPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitPost = () => {
    console.log('Submitting new post:', newPost);
    setNewPost({ title: '', content: '', category: '', tags: '' });
    setShowNewPostForm(false);
  };

  const startExpertChat = (expert: Expert) => {
    console.log('Starting chat with expert:', expert.name);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="discussions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="experts">Expert Q&A</TabsTrigger>
          <TabsTrigger value="events">Events & Workshops</TabsTrigger>
        </TabsList>

        <TabsContent value="discussions" className="space-y-6">
          {/* Search and Controls */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Community Discussions</CardTitle>
                <Button onClick={() => setShowNewPostForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* New Post Form */}
          {showNewPostForm && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Start New Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Discussion title..."
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
                <Textarea
                  placeholder="What would you like to discuss?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                />
                <div className="flex gap-4">
                  <Input
                    placeholder="Category"
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmitPost}>Post Discussion</Button>
                  <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discussion Posts */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="shadow-soft hover:shadow-strong transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.avatar} alt={post.author} />
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                        <h3 className="font-semibold text-lg hover:text-primary cursor-pointer">
                          {post.title}
                        </h3>
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.author} • {post.authorRole}</span>
                          <Badge variant="secondary" className="text-xs">
                            {post.category}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <Reply className="h-4 w-4" />
                            {post.replies}
                          </Button>
                          <span className="text-muted-foreground">{post.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="experts" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Agricultural Experts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experts.map((expert) => (
                  <Card key={expert.id} className="shadow-soft">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={expert.avatar} alt={expert.name} />
                            <AvatarFallback>{expert.name[0]}</AvatarFallback>
                          </Avatar>
                          {expert.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{expert.name}</h3>
                          <p className="text-sm text-muted-foreground">{expert.title}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Specialization:</strong> {expert.specialization}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(expert.rating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{expert.rating}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Responds in {expert.responseTime}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={() => startExpertChat(expert)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask Question
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Upcoming Events & Workshops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.attendees} registered
                            </div>
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <p className="text-sm text-muted-foreground">{event.location}</p>
                          <Button size="sm">
                            Register
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
