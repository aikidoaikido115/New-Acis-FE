declare module "next" {
  export type Metadata = Record<string, unknown>;
  export type NextConfig = Record<string, unknown>;
}

declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";

  export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    children?: ReactNode;
  }

  export default function Link(props: LinkProps): JSX.Element;
}

declare module "next/image" {
  import type { ImgHTMLAttributes } from "react";

  export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    alt: string;
    fill?: boolean;
    priority?: boolean;
    unoptimized?: boolean;
  }

  export default function Image(props: ImageProps): JSX.Element;
}

declare module "next/navigation" {
  export interface AppRouterInstance {
    back(): void;
    forward(): void;
    refresh(): void;
    push(url: string): void;
    replace(url: string): void;
    prefetch(url: string): Promise<void>;
  }

  export function useRouter(): AppRouterInstance;
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T extends Record<string, string | string[]>>(): T;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module "next/headers" {
  export function cookies(): {
    get(name: string): { name: string; value: string } | undefined;
  };
}

declare module "next/font/google" {
  export function Sarabun(options?: {
    subsets?: string[];
    variable?: string;
    weight?: string | string[];
    display?: string;
  }): { className: string; variable?: string };
}

declare module "next/server" {
  export interface NextURL extends URL {
    clone(): NextURL;
  }

  export interface NextCookies {
    get(name: string): { name: string; value: string } | undefined;
  }

  export interface NextRequest extends Request {
    nextUrl: NextURL;
    cookies: NextCookies;
  }

  export class NextResponse extends Response {
    static next(): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
  }

}