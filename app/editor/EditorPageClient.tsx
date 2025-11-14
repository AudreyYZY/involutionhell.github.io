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

  const handlePublish = () => {
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

      // 第一阶段：仅在控制台输出数据
      console.group("第一阶段：文章数据已准备就绪");
      console.log("标题:", title);
      console.log("描述:", description);
      console.log("标签:", tags);
      console.log("文件名:", filename);
      console.log("Markdown 长度:", markdown.length, "字符");
      console.log("图片数量:", imageFileMap.size);

      // 列出所有图片信息
      if (imageFileMap.size > 0) {
        console.group("图片列表");
        imageFileMap.forEach((file, blobUrl) => {
          console.log(`- ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
          console.log(`  Blob URL: ${blobUrl}`);
        });
        console.groupEnd();
      }

      // 显示 Markdown 内容预览
      console.group("Markdown 内容预览");
      console.log(markdown.substring(0, 500) + "...");
      console.groupEnd();

      console.groupEnd();

      // 提示用户
      alert(
        `第一阶段完成！\n\n已准备发布文章：${title}\n包含 ${imageFileMap.size} 张图片\n\n详细信息请查看浏览器控制台。\n\n第二阶段将实现图片上传到 R2。`,
      );
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950">
          <h3 className="font-medium mb-2">第一阶段功能</h3>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>支持 Markdown 编辑和实时预览</li>
            <li>支持粘贴和拖拽图片（图片以 blob URL 存储）</li>
            <li>点击"发布文章"查看控制台输出</li>
            <li>第二阶段将实现图片上传到 Cloudflare R2</li>
            <li>第三阶段将实现发布到 GitHub</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
