import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, FileText, Video, Image as ImageIcon, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Try to import directly. If Vite throws an error later, we can fetch from public or handle it.
// Assuming Vite workspace resolves this.
import campusData from "../../../data/seed/frontend-backend-campus-life.json";

interface Media {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
  caption?: string;
  durationSec?: number;
}

interface Event {
  id: string;
  title: string;
  summary: string;
  startTime: string;
  endTime: string;
  location: string;
  tags: string[];
  media: Media[];
}

export default function DiaryTemplatesPage() {
  const events = (campusData.events as Event[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 font-sans">
      <header className="sticky top-0 z-10 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link
            to="/"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full")}
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">多模态日记预览</h1>
            <p className="text-sm text-muted-foreground">基于校园生活数据集的日志展示模板</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Tabs defaultValue="daily" className="w-full">
          <div className="mb-8 flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                校园生活日报
              </TabsTrigger>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <FileText className="size-4" />
                学习工作周报
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="daily" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <DailyTimelineTemplate events={events} />
          </TabsContent>

          <TabsContent value="report" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <WeeklyReportTemplate events={events} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DailyTimelineTemplate({ events }: { events: Event[] }) {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
      {events.map((event) => {
        const date = new Date(event.startTime);
        const timeString = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

        return (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-white font-bold text-xs">
              {timeString}
            </div>

            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
              <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="pb-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary">{event.location}</span>
                    <div className="flex gap-1">
                      {event.tags.filter(t => t.startsWith("Mood:")).map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                          {t.replace("Mood: ", "")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{event.summary}</p>
                  
                  {/* Media Gallery */}
                  {event.media && event.media.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {event.media.slice(0, 4).map((m, i) => (
                        <div key={m.id} className={cn("relative rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video group/media", 
                          event.media.length === 1 ? 'col-span-2' : 
                          event.media.length === 3 && i === 0 ? 'col-span-2' : '')}>
                          {m.type === "video" ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/media:bg-black/20 transition-colors">
                              <PlayCircle className="text-white opacity-80 size-8 drop-shadow-md" />
                            </div>
                          ) : null}
                          <img 
                            src={m.url.startsWith("http") ? m.url : `https://picsum.photos/seed/${m.id}/400/300`} 
                            alt={m.title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent">
                            <span className="text-white text-[10px] font-medium line-clamp-1">{m.title}</span>
                          </div>
                        </div>
                      ))}
                      {event.media.length > 4 && (
                        <div className="relative rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-video flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">+{event.media.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {event.tags.filter(t => !t.startsWith("Mood:")).map(t => (
                      <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyReportTemplate({ events }: { events: Event[] }) {
  // Group events by some criteria or just show them as a cohesive report
  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-950 rounded-xl shadow-sm border p-8 md:p-12 space-y-12">
      
      {/* Document Header */}
      <div className="border-b pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">第一周：新学期开学总结与工作展望</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            <span>2026年9月1日 - 9月7日</span>
          </div>
          <Badge variant="secondary" className="font-normal">工作周报</Badge>
          <Badge variant="secondary" className="font-normal">多模态记录</Badge>
        </div>
      </div>

      {/* Editor Content Simulation */}
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          本周迎来了新学期的开始。总体而言，校园生活丰富充实，科研工作也逐步走上正轨。以下是本周关键事件的纪要与多模态总结。
        </p>

        {events.map((event) => (
          <div key={event.id} className="not-prose my-8 p-6 rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
            
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              {event.title}
            </h3>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span>{new Date(event.startTime).toLocaleDateString()}</span>
              <span>•</span>
              <span>{event.location}</span>
            </div>

            <p className="text-sm mb-6 leading-relaxed">
              {event.summary}
            </p>

            {/* Embedded Media Block */}
            {event.media && event.media.length > 0 && (
              <div className="bg-white dark:bg-slate-950 rounded-lg border p-1 shadow-sm mb-4">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 p-2 scrollbar-thin">
                  {event.media.map(m => (
                    <div key={m.id} className="relative flex-none w-64 aspect-video rounded overflow-hidden snap-center group/item cursor-pointer">
                      {m.type === "video" && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 z-10">
                          <Video className="size-3 text-white" />
                        </div>
                      )}
                      {m.type === "photo" && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 z-10">
                          <ImageIcon className="size-3 text-white" />
                        </div>
                      )}
                      <img 
                        src={m.url.startsWith("http") ? m.url : `https://picsum.photos/seed/${m.id}/400/300`} 
                        alt={m.title}
                        className="object-cover w-full h-full group-hover/item:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex items-end p-3">
                        <p className="text-white text-xs font-medium">{m.caption || m.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Simulated AI summary or follow-up note */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-md p-4 mt-4 border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">AI 归纳与洞察</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                在这个事件中，可以看出你对 <span className="font-medium text-primary">{event.tags[0]}</span> 表现出了高度的兴趣。建议在接下来的计划中，可以进一步加深在 <strong>{event.location}</strong> 的相关投入。
              </p>
            </div>
            
          </div>
        ))}
        
        <hr className="my-8" />
        
        <h3 className="text-xl font-bold">下周计划与展望</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li>继续推进实验室的科研项目，完成初步的数据采集工作。</li>
          <li>增加在图书馆的阅读时间，重点跟进相关文献。</li>
          <li>参加至少一次社团活动，保持身心健康与劳逸结合。</li>
        </ul>
      </div>
    </div>
  );
}
