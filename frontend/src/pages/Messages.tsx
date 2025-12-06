import { useState } from 'react';
import { useConversations, useMessages, useSendMessage, useMarkMessagesAsRead } from '@/api/hooks/useCommunity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Paperclip, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConversation || '');
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesAsRead();

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    markAsRead.mutate(conversationId);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() && attachments.length === 0) return;
    if (!selectedConversation) return;

    const conversation = conversations?.find(c => c.id === selectedConversation);
    if (!conversation) return;

    const recipient = conversation.participants.find(p => p.id !== user?.id);
    if (!recipient) return;

    try {
      await sendMessage.mutateAsync({
        recipientId: recipient.id,
        content: messageContent.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setMessageContent('');
      setAttachments([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const filteredConversations = conversations?.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    return otherParticipant?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Connect and communicate with your community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {conversationsLoading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations && filteredConversations.length > 0 ? (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => {
                      const otherParticipant = conversation.participants.find(
                        (p) => p.id !== user?.id
                      );
                      const isSelected = selectedConversation === conversation.id;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => handleConversationSelect(conversation.id)}
                          className={cn(
                            'w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left',
                            isSelected && 'bg-muted'
                          )}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={otherParticipant?.avatar}
                              alt={otherParticipant?.username}
                            />
                            <AvatarFallback>
                              {otherParticipant?.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold truncate">
                                {otherParticipant?.username}
                              </p>
                              {conversation.unread_count > 0 && (
                                <Badge variant="default" className="ml-2">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            {conversation.last_message && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.last_message.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(conversation.updated_at)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages Header */}
                <CardHeader className="pb-3 border-b">
                  {(() => {
                    const conversation = conversations?.find(
                      (c) => c.id === selectedConversation
                    );
                    const otherParticipant = conversation?.participants.find(
                      (p) => p.id !== user?.id
                    );

                    return (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={otherParticipant?.avatar}
                            alt={otherParticipant?.username}
                          />
                          <AvatarFallback>
                            {otherParticipant?.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{otherParticipant?.username}</p>
                          <p className="text-xs text-muted-foreground">Active</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardHeader>

                {/* Messages List */}
                <CardContent className="flex-1 p-4 overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-16 w-64 rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.sender.id === user?.id;

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex gap-3',
                                isOwnMessage && 'flex-row-reverse'
                              )}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={message.sender.avatar}
                                  alt={message.sender.username}
                                />
                                <AvatarFallback>
                                  {message.sender.username[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div
                                className={cn(
                                  'flex flex-col max-w-[70%]',
                                  isOwnMessage && 'items-end'
                                )}
                              >
                                <div
                                  className={cn(
                                    'rounded-lg p-3',
                                    isOwnMessage
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap">
                                    {message.content}
                                  </p>

                                  {/* Attachments */}
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map((attachment, idx) => (
                                        <a
                                          key={idx}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs hover:underline"
                                        >
                                          <Paperclip className="h-3 w-3" />
                                          {attachment.filename}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(message.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No messages yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <Paperclip className="h-3 w-3" />
                          {file.name}
                          <button
                            onClick={() =>
                              setAttachments(attachments.filter((_, i) => i !== idx))
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      multiple
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    <Textarea
                      placeholder="Type a message..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={1}
                      className="resize-none flex-1"
                    />

                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        sendMessage.isPending ||
                        (!messageContent.trim() && attachments.length === 0)
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
