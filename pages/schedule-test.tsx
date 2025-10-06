import React from 'react';
import { GetServerSideProps } from 'next';
import { RequestHelper } from '../lib/request-helper';

/**
 * Simple test page to debug schedule issues
 */
export default function ScheduleTest(props: { scheduleCard: any[] }) {
  console.log('Schedule data:', props.scheduleCard);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Schedule Test Page</h1>
      <p className="mb-4">Data loaded: {props.scheduleCard?.length || 0} events</p>

      <div className="space-y-4">
        {props.scheduleCard &&
          props.scheduleCard.map((event, idx) => (
            <div key={idx} className="border p-4 rounded">
              <h2 className="text-2xl font-bold">{event.title}</h2>
              <p>Track: {event.track}</p>
              <p>Location: {event.location}</p>
              <p>Start: {new Date(event.startDate).toLocaleString()}</p>
              <p>End: {new Date(event.endDate).toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const host = context.req.headers.host || 'localhost:3008';
  const baseUrl = `${protocol}://${host}`;

  const { data: scheduleData } = await RequestHelper.get<any[]>(`${baseUrl}/api/schedule`, {});

  return {
    props: {
      scheduleCard: scheduleData || [],
    },
  };
};
