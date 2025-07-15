import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, BarChart3, MapPin } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';

export default function Admin() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin & NGO Portal
          </h1>
          <p className="text-muted-foreground">Monitor programs and track agricultural impact</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">2,547</p>
                <p className="text-sm text-muted-foreground">Active Farmers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <MapPin className="h-8 w-8 text-sky mr-4" />
              <div>
                <p className="text-2xl font-bold">127</p>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <BarChart3 className="h-8 w-8 text-harvest mr-4" />
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Program Success</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="flex items-center p-6">
              <Shield className="h-8 w-8 text-earth mr-4" />
              <div>
                <p className="text-2xl font-bold">₦2.4M</p>
                <p className="text-sm text-muted-foreground">Impact Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Regional Impact Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Northern Ghana', 'Central Ghana', 'Southern Ghana'].map((region) => (
                <div key={region} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">{region}</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Active</Badge>
                    <Badge variant="outline">500+ farmers</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}