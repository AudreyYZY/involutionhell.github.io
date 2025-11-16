"use client";

import { useEffect, useRef, useLayoutEffect } from "react";
import { Crepe } from "@milkdown/crepe";
import type { ImageBlockFeatureConfig } from "@milkdown/crepe/feature/image-block";
import {
  upload,
  uploadConfig,
  type Uploader,
} from "@milkdown/kit/plugin/upload";
import type { Node as ProsemirrorNode } from "@milkdown/kit/prose/model";
import { useEditorStore } from "@/lib/editor-store";

// 导入 Crepe 主题样式
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

/**
 * Milkdown Markdown 编辑器组件
 *
 * 功能：
 * - 支持 Markdown 编辑和实时预览
 * - 图片延迟上传：粘贴/拖拽图片时生成 blob URL，存储 File 对象
 * - 自动同步内容到 Zustand Store
 */
export function MarkdownEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeInstanceRef = useRef<Crepe | null>(null);
  const isLoadingRef = useRef(false);

  const { markdown, setMarkdown, addImage, clearImages } = useEditorStore();

  useLayoutEffect(() => {
    // 编辑器只在组件挂载时初始化一次，不应依赖 store 的变化
    if (!editorRef.current || isLoadingRef.current) return;

    isLoadingRef.current = true;

    const initEditor = async () => {
      try {
        // 图片上传处理函数（延迟上传逻辑）
        const handleImageUpload = async (file: File): Promise<string> => {
          console.log(
            "图片已添加:",
            file.name,
            `(${(file.size / 1024).toFixed(2)} KB)`,
          );

          // 生成本地 blob URL（即时预览）
          const blobUrl = URL.createObjectURL(file);

          // 存储 File 对象到 Zustand Store（延迟上传）
          addImage(blobUrl, file);

          // 返回 blob URL 给编辑器显示
          return blobUrl;
        };

        const imageBlockConfig: ImageBlockFeatureConfig = {
          // 通用图片上传处理
          onUpload: handleImageUpload,
          // 行内图片上传
          inlineOnUpload: handleImageUpload,
          // 块级图片上传
          blockOnUpload: handleImageUpload,
        };

        // 统一处理粘贴/拖拽的图片上传，复用延迟上传逻辑
        const customUploader: Uploader = async (files, schema) => {
          const imageType = schema.nodes.image;
          if (!imageType) {
            throw new Error("Milkdown schema 中缺少 image 节点");
          }

          const nodes: ProsemirrorNode[] = [];
          for (const file of Array.from(files)) {
            if (!file || !file.type.startsWith("image/")) continue;

            const src = await handleImageUpload(file);
            const node = imageType.createAndFill({
              src,
              alt: file.name,
            });
            if (node) {
              nodes.push(node);
            }
          }

          return nodes;
        };

        // 创建 Crepe 编辑器实例，配置图片上传
        const crepe = new Crepe({
          root: editorRef.current!,
          defaultValue:
            markdown ||
            "# 开始写作...\n\n在这里输入你的 Markdown 内容。\n\n支持粘贴图片！",
          featureConfigs: {
            [Crepe.Feature.ImageBlock]: imageBlockConfig,
          },
        });

        crepe.editor.config((ctx) => {
          ctx.update(uploadConfig.key, (prev) => ({
            ...prev,
            enableHtmlFileUploader: true,
            uploader: customUploader,
          }));
        });
        upload.forEach((plugin) => {
          crepe.editor.use(plugin);
        });

        // 创建编辑器
        await crepe.create();

        // 监听内容变化，定时同步到 Store
        const updateMarkdown = () => {
          try {
            const currentMarkdown = crepe.getMarkdown();
            if (currentMarkdown !== markdown) {
              setMarkdown(currentMarkdown);
            }
          } catch (error) {
            console.error("获取 Markdown 内容失败:", error);
          }
        };

        // 每 2 秒同步一次内容
        const syncInterval = setInterval(updateMarkdown, 2000);

        // 保存实例引用
        crepeInstanceRef.current = crepe;
        isLoadingRef.current = false;

        console.log("Milkdown 编辑器初始化成功");

        // 清理定时器
        return () => {
          clearInterval(syncInterval);
        };
      } catch (error) {
        console.error("编辑器初始化失败:", error);
        isLoadingRef.current = false;
      }
    };

    const cleanup = initEditor();

    // 清理函数
    return () => {
      if (cleanup) cleanup.then((fn) => fn?.());

      if (crepeInstanceRef.current && !isLoadingRef.current) {
        try {
          crepeInstanceRef.current.destroy();
          crepeInstanceRef.current = null;
          console.log("编辑器已销毁");
        } catch (error) {
          console.error("编辑器销毁失败:", error);
        }
      }
    };
  }, []); // 只在组件挂载时初始化一次

  // 组件卸载时清理所有 blob URLs
  useEffect(() => {
    return () => {
      clearImages();
    };
  }, [clearImages]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div
        ref={editorRef}
        className="min-h-[500px] prose prose-slate dark:prose-invert max-w-none p-4"
      />
    </div>
  );
}
