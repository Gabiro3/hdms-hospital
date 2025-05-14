<FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          className="mt-1"
                          disabled={false}
                          placeholder="YYYY-MM-DD"
                        />

                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />