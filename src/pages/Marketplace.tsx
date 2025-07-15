
import { LiveMarketplace } from '@/components/marketplace/LiveMarketplace';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Upload, Search, TrendingUp } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Live Marketplace
          </h1>
          <p className="text-muted-foreground">Connect directly with farmers and buyers across Ghana</p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="search">Advanced Search</TabsTrigger>
            <TabsTrigger value="sell">Sell Products</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-6">
            <LiveMarketplace />
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Advanced Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  List Your Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
