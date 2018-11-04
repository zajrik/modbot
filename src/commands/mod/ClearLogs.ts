import { Command, Message } from '@yamdbf/core';
import { TextChannel, GuildChannelCloneOptions } from 'discord.js';
import { ModClient } from '../../client/ModClient';
import { prompt, PromptResult } from '../../util/Util';

export default class extends Command<ModClient>
{
	public constructor()
	{
		super({
			name: 'clearlogs',
			desc: 'Clear the moderation logs channel, resetting cases to 0',
			usage: '<prefix>clearlogs',
			group: 'mod'
		});
	}

	public async action(message: Message, args: any[]): Promise<any>
	{
		if (!(this.client.isOwner(message.author)
			|| (<TextChannel> message.channel).permissionsFor(message.member).has('MANAGE_GUILD')))
			return message.channel.send('You must have `Manage Server` permissions to use this command.');

		if (!(message.guild.me || await message.guild.members.fetch(this.client.user)).permissions.has('MANAGE_CHANNELS'))
			return message.channel.send(`I need to have \`Manage Channels\` permissions to do that on this server.`);

		if (message.channel.id === await message.guild.storage.settings.get('modlogs'))
			return message.channel.send('You may not use that command in this channel.')
				.then((res: Message) => message.delete().then(() => res.delete()));

		const [result]: [PromptResult] = <[PromptResult]> await prompt(message,
			'Are you sure you want to reset the mod logs in this guild? (__y__es | __n__o)',
			/^(?:yes|y)$/i, /^(?:no|n)$/i);
		if (result === PromptResult.TIMEOUT) return message.channel.send('Command timed out, aborting mod logs reset.');
		if (result === PromptResult.FAILURE) return message.channel.send('Okay, aborting mod logs reset.');

		const resetting: Message = <Message> await message.channel.send('Okay, resetting mod logs.');
		const channel: TextChannel = <TextChannel> message.guild.channels.get(await message.guild.storage.settings.get('modlogs'));
		try
		{
			const newChannel: TextChannel = <TextChannel> await channel.clone();
			await message.guild.storage.settings.set('modlogs', newChannel.id);
			await message.guild.storage.settings.set('cases', 0);

			await channel.delete();
			await newChannel.setPosition(channel.position);
			return resetting.edit('Mod logs successfully reset.');
		}
		catch (err)
		{
			return resetting.edit('There was an error while resetting mod logs.');
		}
	}
}
