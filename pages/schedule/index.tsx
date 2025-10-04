import * as React from 'react';
import { useState, useEffect } from 'react';
import { GroupingState, IntegratedGrouping, ViewState } from '@devexpress/dx-react-scheduler';
import {
  Scheduler,
  DayView,
  Appointments,
  Toolbar,
  DateNavigator,
  TodayButton,
  Resources,
  GroupingPanel,
} from '@devexpress/dx-react-scheduler-material-ui';
import { withStyles, Theme, createStyles } from '@material-ui/core';
import { grey, indigo, blue, teal, purple, red, orange } from '@material-ui/core/colors';
import Paper from '@material-ui/core/Paper';
import { alpha } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/styles';
import classNames from 'clsx';
import { GetServerSideProps } from 'next';
import { RequestHelper } from '../../lib/request-helper';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import Backpack from '@material-ui/icons/LocalMall';
import Description from '@material-ui/icons/BorderColor';
// Removed firebase usage on client to avoid requiring firestore in browser

const styles = ({ palette }: Theme) =>
  createStyles({
    appointment: {
      borderRadius: 0,
      borderBottom: 0,
    },

    EventTypeAppointment: {
      border: `2px solid ${red[500]}`,
      backgroundColor: `${grey[900]}`,
      borderRadius: 8,
      boxShadow: ` 0 0 16px 1px ${red[400]} `,
    },
    SponsorTypeAppointment: {
      border: `2px solid ${orange[500]}`,
      backgroundColor: `${grey[900]}`,
      borderRadius: 8,
      boxShadow: ` 0 0 16px 4px ${orange[500]} `,
    },
    TechTalkTypeAppointment: {
      border: `2px solid ${indigo[500]}`,
      backgroundColor: `${grey[900]}`,
      borderRadius: 8,
      boxShadow: ` 0 0 16px 4px ${indigo[500]} `,
    },
    WorkshopTypeAppointment: {
      border: `2px solid ${purple[500]}`,
      backgroundColor: `${grey[900]}`,
      borderRadius: 8,
      boxShadow: ` 0 0 16px 4px ${purple[500]} `,
    },
    SocialTypeAppointment: {
      border: `2px solid ${blue[500]}`,
      backgroundColor: `${grey[900]}`,
      borderRadius: 8,
      boxShadow: ` 0 0 16px 4px ${blue[500]} `,
    },
    weekEndCell: {
      backgroundColor: alpha(palette.action.disabledBackground, 0.04),
      '&:hover': {
        backgroundColor: alpha(palette.action.disabledBackground, 0.04),
      },
      '&:focus': {
        backgroundColor: alpha(palette.action.disabledBackground, 0.04),
      },
    },
    weekEndDayScaleCell: {
      backgroundColor: alpha(palette.action.disabledBackground, 0.06),
    },
    text: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    content: {
      opacity: 0.7,
    },
    container: {
      width: '100%',
      lineHeight: 1.2,
      height: '100%',
    },
  });

type AppointmentProps = Appointments.AppointmentProps & WithStyles<typeof styles>;
type AppointmentContentProps = Appointments.AppointmentContentProps & WithStyles<typeof styles>;

const isWeekEnd = (date: Date): boolean => date.getDay() === 0 || date.getDay() === 6;
const defaultCurrentDate = new Date(2021, 10, 13, 9, 0);
{
  /* !!!change */
}

const AppointmentContent = withStyles(styles, { name: 'AppointmentContent' })(
  ({ classes, data, ...restProps }: AppointmentContentProps) => {
    let Event = '活動';
    if (data.Event === 2) Event = '贊助商';
    if (data.Event === 3) Event = '技術演講';
    if (data.Event === 4) Event = '工作坊';
    if (data.Event === 5) Event = '社交';

    return (
      <Appointments.AppointmentContent {...restProps} data={data}>
        <div className={classes.container}>
          <div className={classes.text}>{data.title}</div>
          <div className={classNames(classes.text, classes.content)}>{`類型：${Event}`}</div>
          <div className={classNames(classes.text, classes.content)}>
            {`地點：${data.location}`}
          </div>
        </div>
      </Appointments.AppointmentContent>
    );
  },
);

export default function Calendar(props: { scheduleCard: ScheduleEvent[] }) {
  // Parse and normalize schedule data from server
  const normalizedScheduleData = Array.isArray(props.scheduleCard)
    ? props.scheduleCard.map((event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }))
    : [];

  // Hooks
  const [eventData, setEventData] = useState({
    title: '',
    speakers: '',
    date: '',
    time: '',
    page: '',
    description: '',
    location: '',
    track: '',
  });
  const [eventDescription, setEventDescription] = useState(null);

  // Scheduler configuration
  const Appointment = withStyles(styles)(
    ({ onClick, classes, data, ...restProps }: AppointmentProps) => (
      <Appointments.Appointment
        {...restProps}
        className={classNames({
          [classes.EventTypeAppointment]: data.Event === 1,
          [classes.SponsorTypeAppointment]: data.Event === 2,
          [classes.TechTalkTypeAppointment]: data.Event === 3,
          [classes.WorkshopTypeAppointment]: data.Event === 4,
          [classes.SocialTypeAppointment]: data.Event === 5,
          [classes.appointment]: true,
        })}
        data={data}
        onClick={() => changeEventData(data)}
      />
    ),
  );

  // Robust timestamp -> Date parser supporting multiple shapes
  const parseTimestampToDate = (value: any): Date => {
    if (!value) return new Date(0);
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'object') {
      if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
      if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
      if (typeof value.nanoseconds === 'number' && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
      }
      if (typeof value.toDate === 'function') {
        try {
          return value.toDate();
        } catch (e) {}
      }
    }
    return new Date(0);
  };

  const changeEventData = (data) => {
    const startDate = parseTimestampToDate(data.startTimestamp);
    const endDate = parseTimestampToDate(data.endTimestamp);
    //first match extracts day abbreviation
    //second match extracts month abbreviation and the number day of the month
    var dayString =
      startDate.toString().match(/^[\w]{3}/)[0] +
      ', ' +
      startDate.toString().match(/^\w+ (\w{3} \d{1,2})/)[1];

    const speakersData = data.speakers
      ? data.speakers.filter((speaker) => speaker.length !== 0)
      : undefined;

    var speakerString = '';
    if (speakersData !== undefined && speakersData !== null && speakersData.length !== 0) {
      if (speakersData.length == 2) {
        speakerString = `主持人：${speakersData[0]} 和 ${speakersData[1]}`;
      } else if (speakersData.length == 1) {
        speakerString = `主持人：${speakersData[0]}`;
      } else {
        speakerString = '主持人：';
        for (var i = 0; i < speakersData.length; i++) {
          if (i === speakersData.length - 1) {
            speakerString += '和 ' + speakersData[i];
          } else {
            speakerString += speakersData[i] + '、';
          }
        }
      }
    }
    var timeString = `${(startDate.getHours() + 24) % 12 || 12}:${
      startDate.getMinutes() < 10 ? '0' : ''
    }${startDate.getMinutes()} ${startDate.getHours() < 12 ? 'AM' : 'PM'} - ${
      (endDate.getHours() + 24) % 12 || 12
    }:${endDate.getMinutes() < 10 ? '0' : ''}${endDate.getMinutes()} ${
      endDate.getHours() < 12 ? 'AM' : 'PM'
    }`;

    //setting new event data based on event clicked
    setEventData({
      title: data.title,
      speakers: speakerString,
      date: dayString,
      time: timeString,
      page: data.page,
      description: data.description,
      location: data.location,
      track: data.track,
    });
  };

  useEffect(() => {
    // Split event description by newlines (guard against non-string)
    const descriptionString =
      typeof eventData.description === 'string' ? eventData.description : '';
    const descSplit = descriptionString.split('\n');
    setEventDescription(
      descSplit.map((d, i) => (
        <p key={i} className="mb-2">
          {d}
        </p>
      )),
    );
  }, [eventData]);

  const grouping = [
    {
      resourceName: 'track',
    },
  ];

  const trackColor = (track: string) => {
    if (track === 'General') return teal;
    if (track === 'Technical') return red;
    if (track === 'Social') return indigo;
    if (track === 'Sponsor') return orange;
    if (track === 'Workshop') return blue;
    else return teal;
  };

  const scheduleEvents = normalizedScheduleData;
  const tracks = scheduleEvents.map((event) => event && (event as any).track).filter(Boolean);
  const uniqueTracks = new Set(tracks);

  const resourceInstances = Array.from(uniqueTracks).map((track) => ({
    id: track,
    text: track,
    color: trackColor(track as any),
  }));
  const resources = [
    {
      fieldName: 'track',
      title: 'track',
      instances:
        resourceInstances.length > 0
          ? resourceInstances
          : [{ id: 'General', text: 'General', color: trackColor('General' as any) }],
    },
  ];

  return (
    <>
      <div className="text-6xl font-black p-6">時程表</div>
      <div className="flex flex-wrap lg:justify-between px-6 h-[75vh]">
        {/* Calendar */}
        <div className="overflow-y-auto overflow-x-hidden lg:w-[62%] w-full h-full border-2 border-black rounded-md">
          <Paper>
            <div className="flex flex-row">
              <Scheduler data={normalizedScheduleData}>
                <ViewState defaultCurrentDate={defaultCurrentDate} />
                <DayView startDayHour={8} endDayHour={24} intervalCount={1} />
                <Appointments
                  appointmentComponent={Appointment}
                  appointmentContentComponent={AppointmentContent}
                />
                <Resources data={resources} mainResourceName={'track'} />
                <Toolbar />
                <DateNavigator />
                <TodayButton />
                <GroupingState grouping={grouping} groupByDate={() => true} />
                <IntegratedGrouping />
                <GroupingPanel />
              </Scheduler>
            </div>
          </Paper>
        </div>

        {/* Event info card */}
        <div className="overflow-y-auto flex flex-col justify-between lg:w-[36%] w-full h-full lg:my-0 my-2 border-2 border-black rounded-md bg-white p-4">
          <section>
            {eventData.title === '' ? (
              <div className="text-2xl">點擊活動以查看更多資訊</div>
            ) : (
              <div />
            )}
            <h1 className="md:text-4xl text-2xl font-bold">{eventData.title}</h1>
            <div className="md:text-lg text-sm mb-4">{eventData.speakers}</div>

            {/* Shows card info if user has clicked on an event */}
            <div className={eventData.title === '' ? 'hidden' : 'inline'}>
              <div className="grid grid-cols-2 gap-y-2 md:my-8 my-6 md:text-lg text-sm">
                <div className="">
                  <p className="flex items-center font-semibold">
                    {<CalendarIcon style={{ fontSize: 'medium', margin: '2px' }} />}
                    日期
                  </p>
                  <p>{eventData.date}</p>
                </div>
                <div className="">
                  <p className="flex items-center font-semibold">
                    {<PinDrop style={{ fontSize: 'medium', margin: '2px' }} />}
                    地點
                  </p>
                  <p>{eventData.location}</p>
                </div>
                <div className="">
                  <p className="flex items-center font-semibold">
                    {<ClockIcon style={{ fontSize: 'large', margin: '2px' }} />}
                    時間
                  </p>
                  <p>{eventData.time}</p>
                </div>
                <div className="">
                  <p className="flex items-center font-semibold">
                    {<Backpack style={{ fontSize: 'medium', margin: '2px' }} />}
                    頁面
                  </p>
                  <p>{eventData.page}</p>
                </div>
              </div>

              <div className="lg:text-base text-sm">
                <p className="flex items-center font-semibold">
                  {<Description style={{ fontSize: 'medium', margin: '2px' }} />}
                  說明
                </p>
                <p>{eventDescription}</p>
              </div>
            </div>
          </section>

          <div className="text-right">*所有活動時間均以 CST 為準</div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  const { data: scheduleData } = await RequestHelper.get<ScheduleEvent[]>(
    `${baseUrl}/api/schedule`,
    {},
  );
  return {
    props: {
      scheduleCard: scheduleData,
    },
  };
};
