import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HiTemplate, 
  HiPhotograph, 
  HiTag, 
  HiStar, 
  HiCollection,
  HiArrowRight,
  HiFolder
} from 'react-icons/hi';

export default function ContentManagement() {
  const contentSections = [
    {
      title: 'Homepage Hero Slides & Banners',
      description: 'Manage rich slider images, craft headlines, and promotional call-to-actions on the customer homepage.',
      icon: HiPhotograph,
      color: 'text-gold-400 bg-gold-500/10 border-gold-500/30',
      path: '/admin/hero-settings',
      actionText: 'Configure Hero Banners',
    },
    {
      title: 'Top Announcement & Discount Banner',
      description: 'Update the floating header bar text, promo coupon codes, and festival discount announcements.',
      icon: HiTag,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      path: '/admin/discount-banner',
      actionText: 'Edit Discount Bar',
    },
    {
      title: 'Handicraft Categories & Craft Taxonomy',
      description: 'Modify category cover images, descriptions, subcategory tags, and featured artisanal traditions.',
      icon: HiFolder,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      path: '/admin/categories',
      actionText: 'Manage Categories',
    },
    {
      title: 'AI Smart Catalog Listings',
      description: 'Review and feature high-fidelity AI-generated handicraft listings on the storefront homepage.',
      icon: HiStar,
      color: 'text-green-400 bg-green-500/10 border-green-500/30',
      path: '/admin/ai',
      actionText: 'Audit AI Listings',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
          <HiTemplate className="text-gold-400 w-7 h-7" /> Content Management & Storefront Visuals
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Customize customer-facing banners, seasonal festival announcements, and curated collections.
        </p>
      </div>

      {/* Content Hub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentSections.map((sec, idx) => (
          <div
            key={idx}
            className="card p-6 flex flex-col justify-between border border-dark-600 hover:border-gold-500/40 transition-all group space-y-4"
          >
            <div className="space-y-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${sec.color}`}>
                <sec.icon className="w-6 h-6" />
              </div>
              <h2 className="font-serif font-bold text-white text-lg group-hover:text-gold-400 transition-colors">
                {sec.title}
              </h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                {sec.description}
              </p>
            </div>

            <Link
              to={sec.path}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2.5 font-semibold group-hover:border-gold-500/50 group-hover:text-gold-400 transition-all"
            >
              <span>{sec.actionText}</span>
              <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
