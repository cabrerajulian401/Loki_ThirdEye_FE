import { createOfficeComposeService, createOfficeEmailContextService }
  from "../../infrastructure/office/officeServices";

afterEach(() => { delete global.Office; });

it("uses displayNewMessageForm when Office mailbox exists", async () => {
  const spy = jest.fn();
  global.Office = { context: { mailbox: { displayNewMessageForm: spy } } };
  const r = await createOfficeComposeService().openDraft({ to: "a@b.com", subject: "S", body: "L1\nL2" });
  expect(spy).toHaveBeenCalledWith({ toRecipients: ["a@b.com"], subject: "S", htmlBody: "L1<br>L2" });
  expect(r.data.via).toBe("office");
});

it("falls back to mailto without Office", async () => {
  const open = jest.spyOn(window, "open").mockImplementation(() => null);
  const r = await createOfficeComposeService().openDraft({ to: "a@b.com", subject: "S", body: "B" });
  expect(open).toHaveBeenCalledWith(expect.stringContaining("mailto:a@b.com?subject=S&body=B"));
  expect(r.data.via).toBe("mailto");
});

it("email context maps mailbox.item and returns null when absent", async () => {
  global.Office = { context: { mailbox: { item: { itemId: "m1", conversationId: "c1",
    from: { displayName: "Maria Chen", emailAddress: "maria@acmesteel.com" }, subject: "RE: PO" } } } };
  expect(await createOfficeEmailContextService().getOpenEmail()).toEqual({
    messageId: "m1", conversationId: "c1", sender: "Maria Chen",
    senderEmail: "maria@acmesteel.com", subject: "RE: PO" });
  delete global.Office;
  expect(await createOfficeEmailContextService().getOpenEmail()).toBeNull();
});
