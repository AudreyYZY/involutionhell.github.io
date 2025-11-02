"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  activityEventsConfig,
  type ActivityEvent,
  type ActivityTickerSettings,
} from "@/app/types/event";
import { cn } from "@/lib/utils";

const { events: rawEvents, settings } = activityEventsConfig;

const {
  maxItems: configuredMaxItems = 3,
  rotationIntervalMs: configuredRotationIntervalMs = 8000,
}: ActivityTickerSettings = settings;

// 默认配置，从data/event.json中读取配置
const MAX_ITEMS = configuredMaxItems;
const ROTATION_INTERVAL_MS = configuredRotationIntervalMs;

/** ActivityTicker 外部传入的样式配置 */
type ActivityTickerProps = {
  /** 容器额外类名，用于控制宽度与定位 */
  className?: string;
};

/**
 * 首页活动轮播组件：
 * - 读取 event.json 配置的活动数量
 * - 自动轮播封面图，顶部指示器支持手动切换
 * - 底部两个毛玻璃按钮：Discord 永远可见，Playback 仅在 deprecated=true 时显示
 */
export function ActivityTicker({ className }: ActivityTickerProps) {
  // 预处理活动列表，保持初次渲染后的引用稳定
  const events = useMemo<ActivityEvent[]>(() => {
    return rawEvents.slice(0, MAX_ITEMS);
  }, []);

  // 当前展示的活动索引
  const [activeIndex, setActiveIndex] = useState(0);
  const totalEvents = events.length;

  useEffect(() => {
    if (totalEvents <= 1) {
      return;
    }

    // 定时轮播，间隔 ROTATION_INTERVAL_MS
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalEvents);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [totalEvents, activeIndex]);

  const handlePrev = useCallback(() => {
    if (totalEvents <= 1) {
      return;
    }
    setActiveIndex((prev) => (prev - 1 + totalEvents) % totalEvents);
  }, [totalEvents]);

  const handleNext = useCallback(() => {
    if (totalEvents <= 1) {
      return;
    }
    setActiveIndex((prev) => (prev + 1) % totalEvents);
  }, [totalEvents]);

  if (totalEvents === 0) {
    return null;
  }

  const activeEvent = events[activeIndex];
  const coverSrc = activeEvent.coverUrl;
  const showPlayback = activeEvent.deprecated && Boolean(activeEvent.playback);

  return (
    <aside
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-border bg-background/70 text-left shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/50",
        className,
      )}
    >
      <div className="group relative aspect-[5/4] w-full overflow-hidden">
        <Image
          src={coverSrc}
          alt={activeEvent.name}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 288px, 90vw"
          priority
          className="object-contain object-top"
        />
        {/* 下半透明渐变，用于保证文字与按钮对比度 */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {events.length > 1 && (
          <>
            {/* 多条活动时显示手动切换指示器 */}
            <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-3">
              {events.map((event, idx) => (
                <button
                  key={`${event.name}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`切换到 ${event.name}`}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-opacity",
                    idx === activeIndex
                      ? "bg-white/90 opacity-100"
                      : "bg-white/40 opacity-60 hover:opacity-85",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="上一条活动"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="下一条活动"
              onClick={handleNext}
              className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white shadow-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        {/* 底部毛玻璃按钮，根据 deprecated 控制回放按钮可见性 */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 top-3/4 z-10 grid border-t border-white/15 bg-white/20 text-sm font-medium text-white shadow-lg backdrop-blur-md",
            showPlayback ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          <Link
            href={activeEvent.discord}
            prefetch={false}
            className="flex h-full items-center justify-center px-3 text-white transition-colors hover:bg-white/25 hover:text-white"
          >
            Discord
          </Link>
          {showPlayback && (
            <Link
              href={activeEvent.playback as string}
              prefetch={false}
              className="flex h-full items-center justify-center border-l border-white/15 px-3 text-white transition-colors hover:bg-white/25 hover:text-white"
            >
              Playback
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
