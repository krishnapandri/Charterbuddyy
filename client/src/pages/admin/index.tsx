import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  BookOpen, 
  Clock, 
  FileText, 
  HelpCircle, 
  Users 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { data: topics } = useQuery({
    queryKey: ["/api/topics"],
    refetchOnWindowFocus: false,
  });

  const { data: questions } = useQuery({
    queryKey: ["/api/questions/all"],
    refetchOnWindowFocus: false,
  });

  const { data: practiceSets } = useQuery({
    queryKey: ["/api/practice-sets"],
    refetchOnWindowFocus: false,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your CFA Exam Preparation platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topics?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                CFA Level I subject areas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Practice questions available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Practice Sets</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{practiceSets?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Prepared question sets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24h</div>
              <p className="text-xs text-muted-foreground">
                Last platform update
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
              <CardDescription>
                Questions and practice sets by topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <BarChart className="h-16 w-16 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Topic distribution chart</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Recent student engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded">
                <Users className="h-16 w-16 text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">User activity chart</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}