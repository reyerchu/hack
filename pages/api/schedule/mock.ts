import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock schedule endpoint for testing without Firebase
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const mockScheduleEvents = [
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
      endTimestamp: { _seconds: new Date('2024-11-13T13:00:00').getTime() / 1000 },
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

  res.status(200).json(mockScheduleEvents);
}
