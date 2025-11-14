import { create } from "zustand";

/**
 * 编辑器状态管理 Store
 * 用于管理文章元数据、Markdown 内容和图片文件
 */
interface EditorState {
  // 文章元数据
  title: string;
  description: string;
  tags: string[];
  filename: string;

  // 编辑器内容
  markdown: string;

  // 图片管理：blob URL -> File 对象
  // 用于延迟上传，第一阶段存储，第二阶段上传到 R2
  imageFileMap: Map<string, File>;

  // Actions
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  setFilename: (filename: string) => void;
  setMarkdown: (markdown: string) => void;

  // 图片管理 Actions
  addImage: (blobUrl: string, file: File) => void;
  removeImage: (blobUrl: string) => void;
  getImages: () => Map<string, File>;
  clearImages: () => void;

  // 重置所有状态
  reset: () => void;
}

const initialState = {
  title: "",
  description: "",
  tags: [],
  filename: "",
  markdown: "",
  imageFileMap: new Map<string, File>(),
};

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialState,

  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setTags: (tags) => set({ tags }),
  setFilename: (filename) => set({ filename }),
  setMarkdown: (markdown) => set({ markdown }),

  addImage: (blobUrl, file) =>
    set((state) => {
      const newMap = new Map(state.imageFileMap);
      newMap.set(blobUrl, file);
      return { imageFileMap: newMap };
    }),

  removeImage: (blobUrl) =>
    set((state) => {
      const newMap = new Map(state.imageFileMap);
      // 释放 blob URL 内存
      URL.revokeObjectURL(blobUrl);
      newMap.delete(blobUrl);
      return { imageFileMap: newMap };
    }),

  getImages: () => get().imageFileMap,

  clearImages: () => {
    const map = get().imageFileMap;
    // 释放所有 blob URLs
    map.forEach((_, blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    set({ imageFileMap: new Map() });
  },

  reset: () => {
    // 清理图片内存
    get().clearImages();
    set(initialState);
  },
}));
