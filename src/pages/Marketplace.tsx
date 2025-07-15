
import { LiveMarketplace } from '@/components/marketplace/LiveMarketplace';
import { AdvancedSearch } from '@/components/search/AdvancedSearch';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Upload, Search, TrendingUp } from 'lucide-react';

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8 px-3 md:px-4">
      <div className="container mx-auto space-y-6 md:space-y-8">
        <div className="px-2">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 mb-2">
            <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            Live Marketplace
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Connect directly with farmers and buyers across Ghana</p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 md:h-auto p-1 bg-muted/50">
            <TabsTrigger value="marketplace" className="text-xs md:text-sm py-2 md:py-3">Marketplace</TabsTrigger>
            <TabsTrigger value="search" className="text-xs md:text-sm py-2 md:py-3">Advanced Search</TabsTrigger>
            <TabsTrigger value="sell" className="text-xs md:text-sm py-2 md:py-3">Sell Products</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="px-1">
              <LiveMarketplace />
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="shadow-soft mx-1">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Search className="h-4 w-4 md:h-5 md:w-5" />
                  Advanced Search & Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <AdvancedSearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="shadow-soft mx-1">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Upload className="h-4 w-4 md:h-5 md:w-5" />
                  List Your Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <FileUpload />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
