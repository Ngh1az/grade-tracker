import { useCallback, useEffect, useState } from 'react';
import { listSubjects } from './api.js';
import { applyTheme, getTheme } from './theme.js';
import BrandMark from './BrandMark.jsx';
import OverviewPanel from './panels/OverviewPanel.jsx';
import SubjectsPanel from './panels/SubjectsPanel.jsx';
import SemestersPanel from './panels/SemestersPanel.jsx';
import SettingsPanel from './panels/SettingsPanel.jsx';
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Settings,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const LEVEL_LABEL = {
  'pho-thong': 'Giáo dục phổ thông',
  'dai-hoc': 'Giáo dục đại học',
};

const NAV = [
  { id: 'overview', label: 'Tổng quan', Icon: LayoutDashboard },
  { id: 'subjects', label: 'Môn học', Icon: ListChecks },
  { id: 'semesters', label: 'Học kỳ', Icon: CalendarDays },
  { id: 'settings', label: 'Cài đặt', Icon: Settings },
];

const EMPTY_DATA = {
  subjects: [],
  gpa: 0,
  gpaScale: 4,
  classification: 'Chưa có dữ liệu',
  semesters: [],
};

export default function Dashboard({ user, onUserChange, onLogout }) {
  const [view, setView] = useState('overview');
  const [theme, setTheme] = useState(getTheme);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const level = user.educationLevel;

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await listSubjects());
    } catch (err) {
      setError(`Không tải được dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  const current = NAV.find((n) => n.id === view);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-sidebar-border text-primary">
              <BrandMark size={15} />
            </span>
            <span className="grid min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                Grade Tracker
              </span>
              <span className="truncate text-xs text-muted-foreground">{LEVEL_LABEL[level]}</span>
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ id, label, Icon }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      isActive={view === id}
                      tooltip={label}
                      onClick={() => setView(id)}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Avatar className="size-6.5 shrink-0">
              <AvatarFallback className="text-[11px]">
                {user.email.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {user.email}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 group-data-[collapsible=icon]:hidden"
              onClick={onLogout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block text-muted-foreground">
                Grade Tracker
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{current.label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </header>

        <main className="dash-content">
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription className="flex items-center justify-between gap-3">
                <span>{error}</span>
                <Button type="button" variant="secondary" size="sm" onClick={reload}>
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {view === 'overview' && (
            <OverviewPanel data={data} level={level} loading={loading} onGoSubjects={() => setView('subjects')} />
          )}
          {view === 'subjects' && (
            <SubjectsPanel data={data} level={level} loading={loading} reload={reload} />
          )}
          {view === 'semesters' && <SemestersPanel data={data} level={level} loading={loading} />}
          {view === 'settings' && (
            <SettingsPanel user={user} onUserChange={onUserChange} onLogout={onLogout} reload={reload} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
