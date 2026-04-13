"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import {
  publicBusinessProfile,
  shouldShowPublicLegalField,
} from "@/config/public-business";

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-x-0 border-b-0 px-4 py-6 rounded-none glass-card sm:py-10">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 grid grid-cols-1 gap-6 md:mb-10 md:grid-cols-4 md:gap-10">
          <div>
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shadow-md sm:h-8 sm:w-8">
                <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" aria-hidden />
              </div>
              <span className="section-title">{APP_NAME}</span>
            </div>
            <p className="card-description">
              Фактури и известия за български фирми. Не приемаме плащания вместо вас.
            </p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>{publicBusinessProfile.supportEmail}</p>
              {shouldShowPublicLegalField(publicBusinessProfile.legalCompanyName) ? (
                <p>{publicBusinessProfile.legalCompanyName}</p>
              ) : null}
              {shouldShowPublicLegalField(publicBusinessProfile.legalCompanyId) ? (
                <p>ЕИК: {publicBusinessProfile.legalCompanyId}</p>
              ) : null}
              {shouldShowPublicLegalField(publicBusinessProfile.legalVatId) ? (
                <p>ДДС №: {publicBusinessProfile.legalVatId}</p>
              ) : null}
            </div>
          </div>
          <div>
            <h4 className="marketing-kicker mb-3 sm:mb-4">Продукт</h4>
            <ul className="space-y-2.5 small-text sm:space-y-3">
              <li>
                <Link href="/#top" className="text-muted-foreground hover:text-foreground transition-colors">
                  Начало
                </Link>
              </li>
              <li>
                <Link href="/#product" className="text-muted-foreground hover:text-foreground transition-colors">
                  Продукт
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Възможности
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Цени
                </Link>
              </li>
              <li>
                <Link href="/#compliance" className="text-muted-foreground hover:text-foreground transition-colors">
                  Съответствие (е-фактури)
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-muted-foreground hover:text-foreground transition-colors">
                  Интеграции
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-muted-foreground hover:text-foreground transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="marketing-kicker mb-3 sm:mb-4">Компания</h4>
            <ul className="space-y-2.5 small-text sm:space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  За нас
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Блог
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Контакти
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="marketing-kicker mb-3 sm:mb-4">Правна информация</h4>
            <ul className="space-y-2.5 small-text sm:space-y-3">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Условия за ползване
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Политика за поверителност
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  Бисквитки
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="text-muted-foreground hover:text-foreground transition-colors">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row sm:gap-4 sm:pt-8">
          <p className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
            © {new Date().getFullYear()} {APP_NAME}. Всички права запазени.
          </p>
          <div className="flex items-center gap-3 sm:gap-4">
            {publicBusinessProfile.facebookUrl ? (
              <Link
                href={publicBusinessProfile.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Link>
            ) : null}
            {publicBusinessProfile.xUrl ? (
              <Link
                href={publicBusinessProfile.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="X"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </Link>
            ) : null}
            {publicBusinessProfile.linkedinUrl ? (
              <Link
                href={publicBusinessProfile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
