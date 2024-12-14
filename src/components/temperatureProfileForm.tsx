"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiR } from "~/trpc/react";
import TimezoneSelect from "react-timezone-select";
import { Button } from "./ui/button";

const midStageTemperatureSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  temperature: z.number().min(-10).max(10),
});

const temperatureProfileSchema = z.object({
  bedTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  wakeupTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  initialSleepLevel: z.number().min(-10).max(10),
  midStageTemperatures: z.array(midStageTemperatureSchema),
  finalSleepLevel: z.number().min(-10).max(10),
  timezone: z.object({
    value: z.string(),
    altName: z.string().optional(),
    abbrev: z.string().optional(),
  }),
});

type TemperatureProfileForm = z.infer<typeof temperatureProfileSchema>;

export const TemperatureProfileForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [sleepDurationError, setSleepDurationError] = useState<string | null>(null);
  const [midStageTemperatures, setMidStageTemperatures] = useState<Array<{
    time: string;
    temperature: number;
  }>>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemperatureProfileForm>({
    resolver: zodResolver(temperatureProfileSchema),
    defaultValues: {
      bedTime: "22:00",
      wakeupTime: "06:00",
      initialSleepLevel: 0,
      midStageTemperatures: [],
      finalSleepLevel: 0,
      timezone: { value: "America/New_York" },
    },
  });

  // Add a query to fetch existing profile
  const { data: profile } = apiR.user.getUserTemperatureProfile.useQuery(undefined, {
    onSuccess: (data) => {
      if (data) {
        setIsExistingProfile(true);
        setMidStageTemperatures(data.midStageTemperatures);
        // Set other form values...
      }
      setIsLoading(false);
    },
  });

  const updateProfileMutation = apiR.user.updateUserTemperatureProfile.useMutation({
    onSuccess: () => {
      // Show success message or handle success
    },
  });

  const addMidStageTemperature = () => {
    setMidStageTemperatures([
      ...midStageTemperatures,
      { time: "00:00", temperature: 0 },
    ]);
  };

  const removeMidStageTemperature = (index: number) => {
    setMidStageTemperatures(
      midStageTemperatures.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: TemperatureProfileForm) => {
    // Include midStageTemperatures in the submission
    const formData = {
      ...data,
      midStageTemperatures,
    };
    await updateProfileMutation.mutateAsync(formData);
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Existing bed time and initial temperature controls */}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Mid-Stage Temperatures</h3>
            <Button
              type="button"
              onClick={addMidStageTemperature}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Mid-Stage
            </Button>
          </div>
          
          {midStageTemperatures.map((temp, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={temp.time}
                  onChange={(e) => {
                    const newTemps = [...midStageTemperatures];
                    newTemps[index] = {
                      ...newTemps[index],
                      time: e.target.value,
                    };
                    setMidStageTemperatures(newTemps);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Temperature</label>
                <input
                  type="number"
                  value={temp.temperature}
                  onChange={(e) => {
                    const newTemps = [...midStageTemperatures];
                    newTemps[index] = {
                      ...newTemps[index],
                      temperature: parseInt(e.target.value),
                    };
                    setMidStageTemperatures(newTemps);
                  }}
                  min="-10"
                  max="10"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <Button
                type="button"
                onClick={() => removeMidStageTemperature(index)}
                className="mt-6 bg-red-500 hover:bg-red-600 text-white"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Existing final temperature and timezone controls */}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
};