'use server';

import { prisma } from './prisma';

// Helper to convert Prisma Decimal to Number
const toNum = (val: any): number => (val ? Number(val) : 0);

// Helper to format Date to YYYY-MM-DD string
const toDateStr = (date: Date | null | undefined): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Helper to format Date to ISO string
const toIsoStr = (date: Date | null | undefined): string => {
  if (!date) return '';
  return date.toISOString();
};

export async function getInitialData() {
  const [
    profilesRaw,
    brandsRaw,
    servicesRaw,
    certDefsRaw,
    certsRaw,
    customersRaw,
    contractsRaw,
    oneoffsRaw,
    casesRaw,
    notificationsRaw,
    timesheetsRaw,
    sparePartsRaw,
    feedbacksRaw,
    articlesRaw,
  ] = await Promise.all([
    prisma.profile.findMany(),
    prisma.brand.findMany(),
    prisma.service.findMany(),
    prisma.certificateDefinition.findMany(),
    prisma.certificate.findMany(),
    prisma.customer.findMany(),
    prisma.contract.findMany(),
    prisma.oneOff.findMany(),
    prisma.case.findMany({
      include: {
        comments: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    }),
    prisma.appNotification.findMany({
      orderBy: {
        timestamp: 'desc',
      },
    }),
    prisma.timesheet.findMany({
      orderBy: {
        created_at: 'desc',
      },
    }),
    prisma.sparePart.findMany(),
    prisma.caseFeedback.findMany(),
    prisma.knowledgeArticle.findMany(),
  ]);

  const profiles = profilesRaw.map((p) => ({
    ...p,
    hourly_cost: toNum(p.hourly_cost),
    updated_at: toIsoStr(p.updated_at),
  }));

  const brands = brandsRaw.map((b) => ({
    ...b,
    updated_at: toIsoStr(b.updated_at),
  }));

  const services = servicesRaw.map((s) => ({
    ...s,
    price_per_hour: toNum(s.price_per_hour),
    updated_at: toIsoStr(s.updated_at),
  }));

  const certificateDefinitions = certDefsRaw.map((cd) => ({
    ...cd,
    updated_at: toIsoStr(cd.updated_at),
  }));

  const certificates = certsRaw.map((c) => ({
    ...c,
    issue_date: toDateStr(c.issue_date),
    expiry_date: toDateStr(c.expiry_date),
    updated_at: toIsoStr(c.updated_at),
  }));

  const customers = customersRaw.map((cust) => ({
    ...cust,
    updated_at: toIsoStr(cust.updated_at),
  }));

  const contracts = contractsRaw.map((con) => ({
    ...con,
    start_date: toDateStr(con.start_date),
    end_date: toDateStr(con.end_date),
    value: toNum(con.value),
    updated_at: toIsoStr(con.updated_at),
  }));

  const oneOffs = oneoffsRaw.map((o) => ({
    ...o,
    amount: toNum(o.amount),
    updated_at: toIsoStr(o.updated_at),
  }));

  const cases = casesRaw.map((c) => ({
    ...c,
    created_at: toIsoStr(c.created_at),
    sla_countdown_hours: toNum(c.sla_countdown_hours),
    comments: c.comments.map((comm) => ({
      author: comm.author,
      text: comm.text,
      date: toIsoStr(comm.date),
    })),
  }));

  const notifications = notificationsRaw.map((n) => ({
    ...n,
    timestamp: toIsoStr(n.timestamp),
  }));

  const timesheets = timesheetsRaw.map((ts) => ({
    ...ts,
    activity_date: toDateStr(ts.activity_date),
    hours_spent: toNum(ts.hours_spent),
    created_at: toIsoStr(ts.created_at),
  }));

  const spareParts = sparePartsRaw.map((sp) => ({
    ...sp,
    stock_in_date: toDateStr(sp.stock_in_date),
    stock_out_date: sp.stock_out_date ? toDateStr(sp.stock_out_date) : null,
    created_at: toIsoStr(sp.created_at),
    updated_at: toIsoStr(sp.updated_at),
  }));

  const caseFeedbacks = feedbacksRaw.map((f) => ({
    ...f,
    created_at: toIsoStr(f.created_at),
  }));

  const knowledgeArticles = articlesRaw.map((a) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(a.tags || '[]');
    } catch (err) {
      tags = [];
    }
    return {
      ...a,
      tags,
      created_at: toIsoStr(a.created_at),
      updated_at: toIsoStr(a.updated_at),
    };
  });

  return {
    profiles,
    brands,
    services,
    certificateDefinitions,
    certificates,
    customers,
    contracts,
    oneOffs,
    cases,
    notifications,
    timesheets,
    spareParts,
    caseFeedbacks,
    knowledgeArticles,
  };
}

// Auth simulation profile update
export async function updateProfileInDb(
  id: string,
  fullName: string,
  role: 'Direktör' | 'Müdür' | 'Presales' | 'Postsales',
  password?: string,
  hourlyCost?: number,
  email?: string
) {
  const roleMap: Record<string, 'Direktor' | 'Mudur' | 'Presales' | 'Postsales'> = {
    'Direktör': 'Direktor',
    'Müdür': 'Mudur',
    'Presales': 'Presales',
    'Postsales': 'Postsales',
  };

  const prismaRole = roleMap[role] || 'Postsales';

  await prisma.profile.update({
    where: { id },
    data: {
      full_name: fullName,
      role: prismaRole,
      ...(password !== undefined && { password }),
      ...(hourlyCost !== undefined && { hourly_cost: hourlyCost }),
      ...(email !== undefined && { email }),
    },
  });
}

// Brand Actions
export async function addBrandInDb(brand: { name: string; logo_url?: string | null; description?: string | null }) {
  await prisma.brand.create({
    data: {
      id: `b_${Date.now()}`,
      name: brand.name,
      logo_url: brand.logo_url,
      description: brand.description,
    },
  });
}

export async function updateBrandInDb(id: string, brand: { name?: string; logo_url?: string | null; description?: string | null }) {
  await prisma.brand.update({
    where: { id },
    data: brand,
  });
}

export async function deleteBrandInDb(id: string) {
  await prisma.brand.delete({
    where: { id },
  });
}

// Service Actions
export async function addServiceInDb(service: { name: string; brand_id?: string | null; description?: string | null; price_per_hour: number }) {
  await prisma.service.create({
    data: {
      id: `s_${Date.now()}`,
      name: service.name,
      brand_id: service.brand_id,
      description: service.description,
      price_per_hour: service.price_per_hour,
    },
  });
}

export async function updateServiceInDb(id: string, service: { name?: string; brand_id?: string | null; description?: string | null; price_per_hour?: number }) {
  await prisma.service.update({
    where: { id },
    data: service,
  });
}

export async function deleteServiceInDb(id: string) {
  await prisma.service.delete({
    where: { id },
  });
}

// Certificate Definition Actions
export async function addCertificateDefinitionInDb(certDef: { name: string; brand_id?: string | null }) {
  await prisma.certificateDefinition.create({
    data: {
      id: `cd_${Date.now()}`,
      name: certDef.name,
      brand_id: certDef.brand_id,
    },
  });
}

export async function updateCertificateDefinitionInDb(id: string, certDef: { name?: string; brand_id?: string | null }) {
  await prisma.certificateDefinition.update({
    where: { id },
    data: certDef,
  });
}

export async function deleteCertificateDefinitionInDb(id: string) {
  await prisma.certificateDefinition.delete({
    where: { id },
  });
}

// Certificate Actions
export async function addCertificateInDb(cert: { name: string; brand_id?: string | null; profile_id?: string | null; issue_date: string; expiry_date: string }) {
  const exp = new Date(cert.expiry_date);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const status: 'Expired' | 'Expiring' | 'Active' = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Expiring' : 'Active';

  await prisma.certificate.create({
    data: {
      id: `c_${Date.now()}`,
      name: cert.name,
      brand_id: cert.brand_id,
      profile_id: cert.profile_id,
      issue_date: new Date(cert.issue_date),
      expiry_date: new Date(cert.expiry_date),
      status,
    },
  });
}

export async function updateCertificateInDb(id: string, cert: { name?: string; brand_id?: string | null; profile_id?: string | null; issue_date?: string; expiry_date?: string }) {
  const data: any = { ...cert };
  if (cert.issue_date) data.issue_date = new Date(cert.issue_date);
  if (cert.expiry_date) {
    data.expiry_date = new Date(cert.expiry_date);
    const exp = new Date(cert.expiry_date);
    const now = new Date();
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    data.status = daysLeft < 0 ? 'Expired' : daysLeft <= 30 ? 'Expiring' : 'Active';
  }

  await prisma.certificate.update({
    where: { id },
    data,
  });
}

export async function deleteCertificateInDb(id: string) {
  await prisma.certificate.delete({
    where: { id },
  });
}

// Customer Actions
export async function addCustomerInDb(customer: { name: string; industry: string; contact_person: string; email: string; phone: string }) {
  await prisma.customer.create({
    data: {
      id: `cust_${Date.now()}`,
      ...customer,
    },
  });
}

export async function updateCustomerInDb(id: string, customer: { name?: string; industry?: string; contact_person?: string; email?: string; phone?: string }) {
  await prisma.customer.update({
    where: { id },
    data: customer,
  });
}

export async function deleteCustomerInDb(id: string) {
  await prisma.customer.delete({
    where: { id },
  });
}

// Contract Actions
export async function addContractInDb(contract: { customer_id?: string | null; name: string; start_date: string; end_date: string; value: number; sla_details?: string | null; status: 'Active' | 'Pending' | 'Expired' }) {
  await prisma.contract.create({
    data: {
      id: `con_${Date.now()}`,
      name: contract.name,
      customer_id: contract.customer_id,
      start_date: new Date(contract.start_date),
      end_date: new Date(contract.end_date),
      value: contract.value,
      sla_details: contract.sla_details,
      status: contract.status,
    },
  });
}

export async function updateContractInDb(id: string, contract: { customer_id?: string | null; name?: string; start_date?: string; end_date?: string; value?: number; sla_details?: string | null; status?: 'Active' | 'Pending' | 'Expired' }) {
  const data: any = { ...contract };
  if (contract.start_date) data.start_date = new Date(contract.start_date);
  if (contract.end_date) data.end_date = new Date(contract.end_date);

  await prisma.contract.update({
    where: { id },
    data,
  });
}

export async function deleteContractInDb(id: string) {
  await prisma.contract.delete({
    where: { id },
  });
}

// OneOff Actions
export async function addOneOffInDb(oneOff: { customer_id?: string | null; name: string; amount: number; status: 'Draft' | 'In Progress' | 'Completed' }) {
  const statusMap: Record<string, 'Draft' | 'InProgress' | 'Completed'> = {
    'Draft': 'Draft',
    'InProgress': 'InProgress',
    'In Progress': 'InProgress',
    'Completed': 'Completed',
  };
  const prismaStatus = statusMap[oneOff.status] || 'Draft';

  await prisma.oneOff.create({
    data: {
      id: `o_${Date.now()}`,
      name: oneOff.name,
      customer_id: oneOff.customer_id,
      amount: oneOff.amount,
      status: prismaStatus,
    },
  });
}

export async function updateOneOffInDb(id: string, oneOff: { customer_id?: string | null; name?: string; amount?: number; status?: 'Draft' | 'In Progress' | 'Completed' }) {
  const data: any = { ...oneOff };
  if (oneOff.status) {
    const statusMap: Record<string, 'Draft' | 'InProgress' | 'Completed'> = {
      'Draft': 'Draft',
      'InProgress': 'InProgress',
      'In Progress': 'InProgress',
      'Completed': 'Completed',
    };
    data.status = statusMap[oneOff.status] || 'Draft';
  }

  await prisma.oneOff.update({
    where: { id },
    data,
  });
}


export async function deleteOneOffInDb(id: string) {
  await prisma.oneOff.delete({
    where: { id },
  });
}

// Case Actions
export async function addCaseInDb(caseData: { customer_id?: string | null; contract_id?: string | null; title: string; description?: string | null; severity: 'Critical' | 'High' | 'Medium' | 'Low'; status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'; assigned_to?: string | null }) {
  let slaVal = 24.0;
  if (caseData.severity === 'Critical') slaVal = 2.0;
  else if (caseData.severity === 'High') slaVal = 4.0;
  else if (caseData.severity === 'Low') slaVal = 72.0;

  const statusMap: Record<string, 'Open' | 'InProgress' | 'Resolved' | 'Closed'> = {
    'Open': 'Open',
    'In Progress': 'InProgress',
    'InProgress': 'InProgress',
    'Resolved': 'Resolved',
    'Closed': 'Closed',
  };
  const prismaStatus = statusMap[caseData.status] || 'Open';

  await prisma.case.create({
    data: {
      id: `t_${Date.now()}`,
      title: caseData.title,
      description: caseData.description,
      severity: caseData.severity,
      status: prismaStatus,
      customer_id: caseData.customer_id,
      contract_id: caseData.contract_id,
      assigned_to: caseData.assigned_to,
      sla_countdown_hours: slaVal,
    },
  });
}

export async function updateCaseInDb(id: string, caseData: { customer_id?: string | null; contract_id?: string | null; title?: string; description?: string | null; severity?: 'Critical' | 'High' | 'Medium' | 'Low'; status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed'; assigned_to?: string | null; sla_countdown_hours?: number }) {
  const data: any = { ...caseData };
  if (caseData.status) {
    const statusMap: Record<string, 'Open' | 'InProgress' | 'Resolved' | 'Closed'> = {
      'Open': 'Open',
      'In Progress': 'InProgress',
      'InProgress': 'InProgress',
      'Resolved': 'Resolved',
      'Closed': 'Closed',
    };
    data.status = statusMap[caseData.status] || 'Open';
  }

  await prisma.case.update({
    where: { id },
    data,
  });
}

export async function deleteCaseInDb(id: string) {
  await prisma.case.delete({
    where: { id },
  });
}

// Case Comments Actions
export async function addCaseCommentInDb(caseId: string, author: string, text: string) {
  await prisma.caseComment.create({
    data: {
      id: `cc_${Date.now()}`,
      case_id: caseId,
      author,
      text,
    },
  });
}

// Notification Actions
export async function addNotificationInDb(notification: { id?: string; title: string; message: string; severity: string }) {
  await prisma.appNotification.create({
    data: {
      id: notification.id || `n_${Date.now()}`,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
    },
  });
}

export async function markNotificationsAsReadInDb() {
  await prisma.appNotification.updateMany({
    data: {
      read: true,
    },
  });
}

export async function markNotificationAsReadInDb(id: string) {
  await prisma.appNotification.update({
    where: { id },
    data: {
      read: true,
    },
  });
}

// Spare Parts Actions
export async function addSparePartInDb(sparePart: { name: string; part_code?: string | null; serial_number?: string | null; brand_id?: string | null; project_id?: string | null; is_pool: boolean; stock_in_date: string; stock_out_date?: string | null }) {
  const status: 'InStock' | 'Out' = sparePart.stock_out_date ? 'Out' : 'InStock';
  await prisma.sparePart.create({
    data: {
      id: `sp_${Date.now()}`,
      name: sparePart.name,
      part_code: sparePart.part_code,
      serial_number: sparePart.serial_number,
      brand_id: sparePart.brand_id,
      project_id: sparePart.project_id,
      is_pool: sparePart.is_pool,
      stock_in_date: new Date(sparePart.stock_in_date),
      stock_out_date: sparePart.stock_out_date ? new Date(sparePart.stock_out_date) : null,
      status,
    },
  });
}

export async function updateSparePartInDb(id: string, sparePart: { name?: string; part_code?: string | null; serial_number?: string | null; brand_id?: string | null; project_id?: string | null; is_pool?: boolean; stock_in_date?: string; stock_out_date?: string | null }) {
  const data: any = { ...sparePart };
  if (sparePart.stock_in_date) data.stock_in_date = new Date(sparePart.stock_in_date);
  if (sparePart.stock_out_date !== undefined) {
    data.stock_out_date = sparePart.stock_out_date ? new Date(sparePart.stock_out_date) : null;
    data.status = sparePart.stock_out_date ? 'Out' : 'InStock';
  }

  await prisma.sparePart.update({
    where: { id },
    data,
  });
}

export async function deleteSparePartInDb(id: string) {
  await prisma.sparePart.delete({
    where: { id },
  });
}

// Timesheet Actions
export async function addTimesheetInDb(timesheet: { profile_id: string; case_id?: string | null; oneoff_id?: string | null; activity_date: string; hours_spent: number; description: string; is_billable: boolean }) {
  await prisma.timesheet.create({
    data: {
      id: `tms_${Date.now()}`,
      profile_id: timesheet.profile_id,
      case_id: timesheet.case_id,
      oneoff_id: timesheet.oneoff_id,
      activity_date: new Date(timesheet.activity_date),
      hours_spent: timesheet.hours_spent,
      description: timesheet.description,
      is_billable: timesheet.is_billable,
      status: 'Draft',
    },
  });
}

export async function updateTimesheetInDb(id: string, timesheet: { profile_id?: string; case_id?: string | null; oneoff_id?: string | null; activity_date?: string; hours_spent?: number; description?: string; is_billable?: boolean }) {
  const data: any = { ...timesheet };
  if (timesheet.activity_date) data.activity_date = new Date(timesheet.activity_date);

  await prisma.timesheet.update({
    where: { id },
    data,
  });
}

export async function deleteTimesheetInDb(id: string) {
  await prisma.timesheet.delete({
    where: { id },
  });
}

export async function approveTimesheetInDb(id: string, status: 'Approved' | 'Rejected' | 'Submitted', approvedBy?: string | null) {
  const statusMap: Record<string, 'Approved' | 'Rejected' | 'Submitted' | 'Draft'> = {
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Submitted': 'Submitted',
  };
  const prismaStatus = statusMap[status] || 'Submitted';

  await prisma.timesheet.update({
    where: { id },
    data: {
      status: prismaStatus,
      approved_by: approvedBy,
    },
  });
}

// Knowledge Article Actions
export async function addKnowledgeArticleInDb(article: { title: string; content: string; brand_id?: string | null; service_id?: string | null; created_by?: string | null; tags: string[] }) {
  await prisma.knowledgeArticle.create({
    data: {
      id: `ka_${Date.now()}`,
      title: article.title,
      content: article.content,
      brand_id: article.brand_id,
      service_id: article.service_id,
      created_by: article.created_by,
      tags: JSON.stringify(article.tags || []),
    },
  });
}

export async function updateKnowledgeArticleInDb(id: string, article: { title?: string; content?: string; brand_id?: string | null; service_id?: string | null; created_by?: string | null; tags?: string[] }) {
  const data: any = { ...article };
  if (article.tags) {
    data.tags = JSON.stringify(article.tags);
  }

  await prisma.knowledgeArticle.update({
    where: { id },
    data,
  });
}

export async function deleteKnowledgeArticleInDb(id: string) {
  await prisma.knowledgeArticle.delete({
    where: { id },
  });
}

export async function incrementViewsInDb(id: string) {
  await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      views_count: {
        increment: 1,
      },
    },
  });
}

export async function voteHelpfulInDb(id: string) {
  await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      helpful_votes: {
        increment: 1,
      },
    },
  });
}

// Case Feedback Actions
export async function addCaseFeedbackInDb(feedback: { case_id: string; rating: number; comments?: string | null }) {
  await prisma.caseFeedback.create({
    data: {
      id: `cf_${Date.now()}`,
      case_id: feedback.case_id,
      rating: feedback.rating,
      comments: feedback.comments,
    },
  });
}

export async function deleteCaseFeedbackInDb(id: string) {
  await prisma.caseFeedback.delete({
    where: { id },
  });
}
