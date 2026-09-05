import { sqliteTable, text, integer, sqliteTableCreator, real } from 'drizzle-orm/sqlite-core';

const createTable = sqliteTableCreator((name) => `smk24_${name}`);

export const programs = createTable('programs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  code: text('code').notNull(),
  duration: text('duration').notNull(),
  careerProspect: text('career_prospect'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }),
});

export const achievements = createTable('achievements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  level: text('level'),
  year: integer('year').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const facilities = createTable('facilities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  imageUrl: text('image_url'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const news = createTable('news', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  category: text('category').notNull(),
  imageUrl: text('image_url'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }),
});

export const announcements = createTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  date: integer('date', { mode: 'number' }).notNull(),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const schedule = createTable('schedule', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  date: integer('date', { mode: 'number' }).notNull(),
  time: text('time'),
  location: text('location'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const gallery = createTable('gallery', {
  id: text('id').primaryKey(),
  title: text('title'),
  imageUrl: text('image_url').notNull(),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const schoolProfile = createTable('school_profile', {
  id: text('id').primaryKey().default('main'),
  name: text('name').notNull().default('SMK Negeri 24 Jakarta'),
  address: text('address').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  website: text('website'),
  vision: text('vision').notNull(),
  mission: text('mission').notNull(),
  history: text('history').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  updatedAt: integer('updated_at', { mode: 'number' }),
});

export const contacts = createTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export const adminUsers = createTable('admin_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('editor'),
  createdAt: integer('created_at', { mode: 'number' }).notNull(),
});

export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Schedule = typeof schedule.$inferSelect;
export type NewSchedule = typeof schedule.$inferInsert;
export type Gallery = typeof gallery.$inferSelect;
export type NewGallery = typeof gallery.$inferInsert;
export type SchoolProfile = typeof schoolProfile.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
