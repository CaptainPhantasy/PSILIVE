import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function exportDatabase() {
  console.log('Exporting database...')
  
  const data: Record<string, any> = {}
  
  try {
    data.users = await prisma.user.findMany()
    console.log(`Exported ${data.users.length} users`)
  } catch (e) { console.log('No users table or error') }
  
  try {
    data.jobs = await prisma.job.findMany()
    console.log(`Exported ${data.jobs.length} jobs`)
  } catch (e) { console.log('No jobs table or error') }
  
  try {
    data.inspections = await prisma.inspection.findMany()
    console.log(`Exported ${data.inspections.length} inspections`)
  } catch (e) { console.log('No inspections table or error') }
  
  try {
    data.contactSubmissions = await prisma.contactSubmission.findMany()
    console.log(`Exported ${data.contactSubmissions.length} contact submissions`)
  } catch (e) { console.log('No contactSubmissions table or error') }
  
  try {
    data.chatConversations = await prisma.chatConversation.findMany()
    console.log(`Exported ${data.chatConversations.length} chat conversations`)
  } catch (e) { console.log('No chatConversations table or error') }
  
  try {
    data.videoAttachments = await prisma.videoAttachment.findMany()
    console.log(`Exported ${data.videoAttachments.length} video attachments`)
  } catch (e) { console.log('No videoAttachments table or error') }
  
  try {
    data.videoChapters = await prisma.videoChapter.findMany()
    console.log(`Exported ${data.videoChapters.length} video chapters`)
  } catch (e) { console.log('No videoChapters table or error') }
  
  try {
    data.clientSignatures = await prisma.clientSignature.findMany()
    console.log(`Exported ${data.clientSignatures.length} client signatures`)
  } catch (e) { console.log('No clientSignatures table or error') }
  
  try {
    data.locationLogs = await prisma.locationLog.findMany()
    console.log(`Exported ${data.locationLogs.length} location logs`)
  } catch (e) { console.log('No locationLogs table or error') }
  
  try {
    data.deliveryTokens = await prisma.deliveryToken.findMany()
    console.log(`Exported ${data.deliveryTokens.length} delivery tokens`)
  } catch (e) { console.log('No deliveryTokens table or error') }
  
  const outputPath = '/home/ubuntu/precision_sewer_inspection/database_export.json'
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
  console.log(`\nDatabase exported to: ${outputPath}`)
  
  await prisma.$disconnect()
}

exportDatabase().catch(console.error)
