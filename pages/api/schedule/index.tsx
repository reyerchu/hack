import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();

const SCHEDULE_EVENTS = '/schedule-events';

/**
 *
 * API endpoint to get data of keynote speakers from backend for the keynote speakers section in home page
 *
 * @param req HTTP request object
 * @param res HTTP response object
 *
 *
 */
async function getScheduleEvents(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检查 Firebase 是否已初始化
    try {
      const db = firestore();
      if (!db) {
        console.warn('Firebase not initialized, returning mock data for schedule events');
        return res.json(getMockScheduleEvents());
      }
    } catch (error) {
      console.warn('Firebase not initialized, returning mock data for schedule events');
      return res.json(getMockScheduleEvents());
    }

    const db = firestore();
    const snapshot = await db.collection(SCHEDULE_EVENTS).get();
    let data = [];
    snapshot.forEach((doc) => {
      const currentEvent = doc.data();
      data.push({
        ...currentEvent,
        startTimestamp: currentEvent.startDate,
        endTimestamp: currentEvent.endDate,
        startDate: currentEvent.startDate.toDate(),
        endDate: currentEvent.endDate.toDate(),
      });
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule events:', error);
    return res.json(getMockScheduleEvents());
  }
}

function getMockScheduleEvents() {
  return [
    {
      title: 'Opening Ceremony',
      Event: 1,
      track: 'General',
      location: 'Main Hall',
      speakers: ['John Doe', 'Jane Smith'],
      description: 'Welcome to the hackathon! Join us for the opening ceremony.',
      page: 'Main Stage',
      startDate: new Date('2024-11-13T09:00:00'),
      endDate: new Date('2024-11-13T10:00:00'),
      startTimestamp: { _seconds: new Date('2024-11-13T09:00:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2024-11-13T10:00:00').getTime() / 1000 },
    },
    {
      title: 'React Workshop',
      Event: 4,
      track: 'Workshop',
      location: 'Room 101',
      speakers: ['Tech Lead'],
      description: 'Learn React basics and build your first component.',
      page: 'Technical Track',
      startDate: new Date('2024-11-13T11:00:00'),
      endDate: new Date('2024-11-13T12:30:00'),
      startTimestamp: { _seconds: new Date('2024-11-13T11:00:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2024-11-13T12:30:00').getTime() / 1000 },
    },
    {
      title: 'Sponsor Tech Talk',
      Event: 3,
      track: 'Technical',
      location: 'Auditorium',
      speakers: ['Company Representative'],
      description: 'Learn about the latest technologies from our sponsor.',
      page: 'Sponsor Area',
      startDate: new Date('2024-11-13T13:00:00'),
      endDate: new Date('2024-11-13T14:00:00'),
      startTimestamp: { _seconds: new Date('2024-11-13T13:00:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2024-11-13T14:00:00').getTime() / 1000 },
    },
    {
      title: 'Networking Social',
      Event: 5,
      track: 'Social',
      location: 'Lounge',
      speakers: [],
      description: 'Meet other hackers and form teams!',
      page: 'Social Area',
      startDate: new Date('2024-11-13T15:00:00'),
      endDate: new Date('2024-11-13T16:00:00'),
      startTimestamp: { _seconds: new Date('2024-11-13T15:00:00').getTime() / 1000 },
      endTimestamp: { _seconds: new Date('2024-11-13T16:00:00').getTime() / 1000 },
    },
  ];
}

async function updateEventDatabase(req: NextApiRequest, res: NextApiResponse) {
  const { startTimestamp, endTimestamp, ...eventData } = JSON.parse(req.body);

  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin']);
  if (!isAuthorized) {
    return res.status(403).json({
      statusCode: 403,
      msg: 'Request is not authorized to perform admin functionality',
    });
  }
  const db = firestore();
  const event = await db.collection(SCHEDULE_EVENTS).where('Event', '==', eventData.Event).get();
  if (event.empty) {
    await db.collection(SCHEDULE_EVENTS).add({
      ...eventData,
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
    });
    return res.status(201).json({
      msg: 'Event created',
    });
  }
  event.forEach(async (doc) => {
    await db
      .collection(SCHEDULE_EVENTS)
      .doc(doc.id)
      .update({
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
      });
  });

  return res.status(200).json({
    msg: 'Event updated',
  });
}

async function deleteEvent(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin']);

  if (!isAuthorized) {
    return res.status(403).json({
      statusCode: 403,
      msg: 'Request is not authorized to perform admin functionality',
    });
  }

  const eventData = JSON.parse(req.body);
  const db = firestore();
  const eventDoc = await db.collection(SCHEDULE_EVENTS).where('Event', '==', eventData.Event).get();
  eventDoc.forEach(async (doc) => {
    await db.collection(SCHEDULE_EVENTS).doc(doc.id).delete();
  });
  return res.json({
    msg: 'Event deleted',
  });
}

function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  return getScheduleEvents(req, res);
}

function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  return updateEventDatabase(req, res);
}

function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse) {
  return deleteEvent(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleGetRequest(req, res);
    }
    case 'POST': {
      return handlePostRequest(req, res);
    }
    case 'DELETE': {
      return handleDeleteRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
