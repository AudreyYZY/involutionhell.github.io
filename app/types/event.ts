/**
 * @description: 活动横幅所需要的类型
 * @param name 活动名称
 * @param discord discord活动链接
 * @param playback 回放链接
 * @param coverUrl 封面地址
 * @param deprecated 是否已经结束
 */
export interface ActivityEvent {
  /** 活动名称，用于轮播标题 */
  name: string;
  /** Discord 活动入口链接 */
  discord: string;
  /** 活动回放链接，deprecated 为 true 时展示 */
  playback?: string;
  /** 活动封面，可以是静态资源相对路径或完整 URL */
  coverUrl: string;
  /** 是否为已结束活动，true 时展示 Playback 按钮 */
  deprecated: boolean;
}

/** 活动轮播可配置参数 */
export interface ActivityTickerSettings {
  /** 首屏最多展示的活动数量 */
  maxItems: number;
  /** 自动轮播的间隔时间（毫秒） */
  rotationIntervalMs: number;
}

/** event.json 的整体结构 */
export interface ActivityEventsConfig {
  settings: ActivityTickerSettings;
  events: ActivityEvent[];
}
