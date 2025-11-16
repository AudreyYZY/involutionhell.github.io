"use client";

import { useEditorStore } from "@/lib/editor-store";
import { EditorMetadataForm } from "@/app/components/EditorMetadataForm";
import { MarkdownEditor } from "@/app/components/MarkdownEditor";
import { Button } from "@/app/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";

interface EditorPageClientProps {
  session: Session;
}

/**
 * 编辑器页面客户端组件
 * 包含表单、编辑器和发布按钮
 */
export function EditorPageClient({ session }: EditorPageClientProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { title, description, tags, filename, markdown, imageFileMap } =
    useEditorStore();

  /**
   * 上传单个图片到 R2
   */
  const uploadImage = async (
    blobUrl: string,
    file: File,
  ): Promise<{ blobUrl: string; publicUrl: string }> => {
    // 生成文章 slug（从 filename 去除 .md 后缀）
    const articleSlug = filename.replace(/\.md$/, "");

    // 1. 获取预签名 URL
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        articleSlug,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "获取上传链接失败");
    }

    const { uploadUrl, publicUrl } = await response.json();

    // 2. 上传文件到 R2
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`上传图片失败: ${uploadResponse.statusText}`);
    }

    return { blobUrl, publicUrl };
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      // 验证必填字段
      if (!title) {
        alert("请输入文章标题");
        return;
      }

      if (!filename) {
        alert("请输入文件名");
        return;
      }

      console.group("第二阶段：开始上传图片到 R2");
      console.log("文章标题:", title);
      console.log("文件名:", filename);
      console.log("图片数量:", imageFileMap.size);

      let finalMarkdown = markdown;

      // 如果有图片，上传到 R2 并替换 URL
      if (imageFileMap.size > 0) {
        console.log("开始上传图片...");

        // 并发上传所有图片
        const uploadPromises = Array.from(imageFileMap.entries()).map(
          ([blobUrl, file]) => uploadImage(blobUrl, file),
        );

        const uploadResults = await Promise.all(uploadPromises);

        console.log("所有图片上传完成！");
        console.group("图片 URL 映射");
        uploadResults.forEach(({ blobUrl, publicUrl }) => {
          console.log(`${blobUrl} -> ${publicUrl}`);
        });
        console.groupEnd();

        // 替换 Markdown 中的 blob URL 为公开 URL
        uploadResults.forEach(({ blobUrl, publicUrl }) => {
          finalMarkdown = finalMarkdown.replaceAll(blobUrl, publicUrl);
        });

        console.log("Markdown 中的 blob URL 已替换为公开 URL");
      }

      console.group("最终 Markdown 内容");
      console.log(finalMarkdown);
      console.groupEnd();

      console.groupEnd();

      // 提示用户
      alert(
        `第二阶段完成！\n\n文章：${title}\n图片已上传：${imageFileMap.size} 张\n\n详细信息请查看浏览器控制台。\n\n第三阶段将实现发布到 GitHub。`,
      );
    } catch (error) {
      console.error("发布失败:", error);
      alert(`发布失败：${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 头部 */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">创作新文章</h1>
          <p className="text-muted-foreground mt-1">
            欢迎，{session.user?.name || session.user?.email}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">返回首页</Button>
        </Link>
      </header>

      {/* 主要内容区域 */}
      <div className="space-y-6">
        {/* 元数据表单 */}
        <EditorMetadataForm />

        {/* Markdown 编辑器 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">文章内容</h2>
            <div className="text-sm text-muted-foreground">
              {markdown.length} 字符 · {imageFileMap.size} 张图片
            </div>
          </div>
          <MarkdownEditor />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">
            {!title || !filename ? (
              <span className="text-destructive">请填写标题和文件名</span>
            ) : (
              <span>准备发布到：{filename}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("确定要清空所有内容吗？")) {
                  useEditorStore.getState().reset();
                  window.location.reload();
                }
              }}
            >
              清空
            </Button>

            <Button
              onClick={handlePublish}
              disabled={!title || !filename || isPublishing}
            >
              {isPublishing ? "处理中..." : "发布文章"}
            </Button>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
          <h3 className="font-medium mb-2">第二阶段功能</h3>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>支持 Markdown 编辑和实时预览</li>
            <li>支持粘贴和拖拽图片（图片以 blob URL 存储）</li>
            <li>点击"发布文章"自动上传图片到 Cloudflare R2</li>
            <li>自动替换 Markdown 中的 blob URL 为公开 URL</li>
            <li>第三阶段将实现发布到 GitHub</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
